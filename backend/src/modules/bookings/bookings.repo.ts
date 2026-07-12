import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

const include = {
  asset: { select: { id: true, name: true, assetTag: true } },
  bookedByUser: { select: { id: true, name: true } },
  onBehalfOfDepartment: { select: { id: true, name: true } },
} satisfies Prisma.BookingInclude;

export const bookingsRepo = {
  list: (where: Prisma.BookingWhereInput, skip: number, take: number) =>
    prisma.$transaction([
      prisma.booking.findMany({ where, include, skip, take, orderBy: { startTime: 'asc' } }),
      prisma.booking.count({ where }),
    ]),

  findById: (id: string) => prisma.booking.findUnique({ where: { id }, include }),

  create: (data: Prisma.BookingUncheckedCreateInput) => prisma.booking.create({ data, include }),

  update: (id: string, data: Prisma.BookingUncheckedUpdateInput) =>
    prisma.booking.update({ where: { id }, data, include }),

  // The calendar feed for one asset — non-cancelled slots, chronological.
  feedForAsset: (assetId: string) =>
    prisma.booking.findMany({
      where: { assetId, status: { not: 'CANCELLED' } },
      include: { bookedByUser: { select: { id: true, name: true } } },
      orderBy: { startTime: 'asc' },
    }),

  // Any non-cancelled booking on the asset that overlaps [start, end).
  // Half-open: newStart < existingEnd AND newEnd > existingStart.
  findOverlap: (assetId: string, start: Date, end: Date, excludeId?: string) =>
    prisma.booking.findFirst({
      where: {
        assetId,
        status: { not: 'CANCELLED' },
        startTime: { lt: end },
        endTime: { gt: start },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      include: { bookedByUser: { select: { id: true, name: true } } },
    }),
};
