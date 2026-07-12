import { Prisma, type Role } from '@prisma/client';
import { bookingsRepo } from './bookings.repo.js';
import type {
  CreateBookingInput,
  RescheduleBookingInput,
  ListBookingsQuery,
} from './bookings.schema.js';
import { badRequest, conflict, forbidden, notFound } from '../../lib/errors.js';
import { parsePagination, paginated } from '../../lib/search.js';
import { assertTransition } from '../../lib/stateMachine.js';
import { emit } from '../../lib/events.js';
import { prisma } from '../../lib/prisma.js';

export interface Actor {
  id: string;
  role: Role;
  departmentId: string | null;
}

// Postgres exclusion_violation (SQLSTATE 23P01) from the no_overlap constraint —
// the race backstop when two overlapping bookings commit concurrently.
function isOverlapDbError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const meta = (err.meta ?? {}) as Record<string, unknown>;
    return err.code === 'P2010' || String(meta.code) === '23P01' || String(err.message).includes('no_overlap');
  }
  return String(err).includes('no_overlap') || String(err).includes('23P01');
}

// Initial lifecycle status implied by the slot vs. now (cron keeps it moving).
function initialStatus(start: Date, end: Date, now: Date): 'UPCOMING' | 'ONGOING' | 'COMPLETED' {
  if (end <= now) return 'COMPLETED';
  if (start <= now) return 'ONGOING';
  return 'UPCOMING';
}

export const bookingsService = {
  async list(query: ListBookingsQuery, actor: Actor) {
    const { skip, take, page } = parsePagination(query);
    const where: Prisma.BookingWhereInput = {};
    if (query.assetId) where.assetId = query.assetId;
    if (query.status) where.status = query.status;
    if (query.mine === 'true') where.bookedByUserId = actor.id;
    const [items, total] = await bookingsRepo.list(where, skip, take);
    return paginated(items, total, { skip, take, page });
  },

  async get(id: string) {
    const booking = await bookingsRepo.findById(id);
    if (!booking) throw notFound('Booking not found');
    return booking;
  },

  assetFeed: (assetId: string) => bookingsRepo.feedForAsset(assetId),

  // Golden Invariant #3 — no overlapping bookings. Service query gives the
  // friendly 409; the no_overlap EXCLUDE constraint is the race backstop.
  async create(input: CreateBookingInput, actor: Actor) {
    const asset = await prisma.asset.findUnique({
      where: { id: input.assetId },
      select: { id: true, isBookable: true, status: true },
    });
    if (!asset) throw notFound('Asset not found');
    if (!asset.isBookable) throw badRequest('Asset is not bookable');

    // Booking scope: employees book only for themselves; a dept head acting on
    // behalf of a department must own that department.
    if (input.onBehalfOfDepartmentId) {
      if (actor.role === 'EMPLOYEE') throw forbidden('Employees cannot book on behalf of a department');
      if (actor.role === 'DEPARTMENT_HEAD' && input.onBehalfOfDepartmentId !== actor.departmentId) {
        throw forbidden('You can only book on behalf of your own department');
      }
    }

    const conflicting = await bookingsRepo.findOverlap(input.assetId, input.startTime, input.endTime);
    if (conflicting) {
      throw conflict('Time slot overlaps an existing booking', {
        conflictBookingId: conflicting.id,
        bookedBy: conflicting.bookedByUser,
        startTime: conflicting.startTime,
        endTime: conflicting.endTime,
      });
    }

    let booking;
    try {
      booking = await bookingsRepo.create({
        assetId: input.assetId,
        bookedByUserId: actor.id,
        onBehalfOfDepartmentId: input.onBehalfOfDepartmentId,
        startTime: input.startTime,
        endTime: input.endTime,
        status: initialStatus(input.startTime, input.endTime, new Date()),
      });
    } catch (err) {
      if (isOverlapDbError(err)) throw conflict('Time slot overlaps an existing booking');
      throw err;
    }

    emit({
      type: 'BookingCreated',
      actorUserId: actor.id,
      entityType: 'Booking',
      entityId: booking.id,
      meta: { assetId: input.assetId, startTime: input.startTime, endTime: input.endTime },
    });
    return booking;
  },

  async cancel(id: string, actor: Actor) {
    const booking = await this.assertCanManage(id, actor);
    assertTransition('booking', booking.status, 'CANCELLED');
    const updated = await bookingsRepo.update(id, { status: 'CANCELLED' });
    emit({
      type: 'BookingCancelled',
      actorUserId: actor.id,
      entityType: 'Booking',
      entityId: id,
      meta: { assetId: booking.assetId },
    });
    return updated;
  },

  async reschedule(id: string, input: RescheduleBookingInput, actor: Actor) {
    const booking = await this.assertCanManage(id, actor);
    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      throw conflict(`Cannot reschedule a ${booking.status.toLowerCase()} booking`);
    }

    const conflicting = await bookingsRepo.findOverlap(booking.assetId, input.startTime, input.endTime, id);
    if (conflicting) {
      throw conflict('Time slot overlaps an existing booking', {
        conflictBookingId: conflicting.id,
        bookedBy: conflicting.bookedByUser,
      });
    }

    try {
      const updated = await bookingsRepo.update(id, {
        startTime: input.startTime,
        endTime: input.endTime,
        status: initialStatus(input.startTime, input.endTime, new Date()),
      });
      emit({
        type: 'BookingRescheduled',
        actorUserId: actor.id,
        entityType: 'Booking',
        entityId: id,
        meta: { startTime: input.startTime, endTime: input.endTime },
      });
      return updated;
    } catch (err) {
      if (isOverlapDbError(err)) throw conflict('Time slot overlaps an existing booking');
      throw err;
    }
  },

  // Only the booker, an Asset Manager, or an Admin may cancel/reschedule.
  async assertCanManage(id: string, actor: Actor) {
    const booking = await bookingsRepo.findById(id);
    if (!booking) throw notFound('Booking not found');
    const privileged = actor.role === 'ADMIN' || actor.role === 'ASSET_MANAGER';
    if (!privileged && booking.bookedByUserId !== actor.id) {
      throw forbidden('You can only manage your own bookings');
    }
    return booking;
  },
};
