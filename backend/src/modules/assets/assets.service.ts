import { Prisma } from '@prisma/client';
import { assetsRepo, type AssetDetail } from './assets.repo.js';
import type { CreateAssetInput, UpdateAssetInput, ListAssetsQuery } from './assets.schema.js';
import { badRequest, notFound } from '../../lib/errors.js';
import { parsePagination, paginated } from '../../lib/search.js';
import { nextAssetTag } from '../../lib/tagGen.js';
import { qrDataUrl, qrPngBuffer } from '../../lib/qr.js';
import { emit } from '../../lib/events.js';

// One item on the unified per-asset history timeline (derived from the
// allocation / transfer / maintenance relations, newest first).
export interface HistoryEntry {
  kind: 'ALLOCATION' | 'TRANSFER' | 'MAINTENANCE';
  id: string;
  at: Date;
  status: string;
  summary: string;
  meta: Record<string, unknown>;
}

export const assetsService = {
  async list(query: ListAssetsQuery) {
    const { skip, take, page } = parsePagination(query);
    const where: Prisma.AssetWhereInput = {};
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.status) where.status = query.status;
    if (query.ownerDepartmentId) where.ownerDepartmentId = query.ownerDepartmentId;
    if (query.assetTag) where.assetTag = { contains: query.assetTag, mode: 'insensitive' };
    if (query.serialNumber) where.serialNumber = { contains: query.serialNumber, mode: 'insensitive' };
    if (query.location) where.location = { contains: query.location, mode: 'insensitive' };
    if (query.isBookable) where.isBookable = query.isBookable === 'true';
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { assetTag: { contains: query.q, mode: 'insensitive' } },
        { serialNumber: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await assetsRepo.list(where, skip, take);
    return paginated(items, total, { skip, take, page });
  },

  async get(id: string) {
    const asset = await assetsRepo.findById(id);
    if (!asset) throw notFound('Asset not found');
    return { ...asset, history: buildHistory(asset) };
  },

  async create(input: CreateAssetInput, actorUserId: string) {
    if (!(await assetsRepo.categoryExists(input.categoryId))) {
      throw badRequest('Category not found');
    }
    if (input.ownerDepartmentId && !(await assetsRepo.departmentExists(input.ownerDepartmentId))) {
      throw badRequest('Owner department not found');
    }

    const assetTag = await nextAssetTag();
    const data: Prisma.AssetUncheckedCreateInput = {
      name: input.name,
      assetTag,
      categoryId: input.categoryId,
      serialNumber: input.serialNumber,
      acquisitionDate: input.acquisitionDate,
      acquisitionCost: input.acquisitionCost,
      condition: input.condition,
      location: input.location,
      isBookable: input.isBookable ?? false,
      photoUrl: input.photoUrl,
      ownerDepartmentId: input.ownerDepartmentId,
      status: 'AVAILABLE',
    };
    if (input.documents !== undefined) {
      data.documents = input.documents as unknown as Prisma.InputJsonValue;
    }

    const asset = await assetsRepo.create(data);
    emit({
      type: 'AssetRegistered',
      actorUserId,
      entityType: 'Asset',
      entityId: asset.id,
      meta: { assetTag: asset.assetTag, name: asset.name },
    });
    return { ...asset, qrDataUrl: await qrDataUrl(asset.assetTag) };
  },

  async update(id: string, input: UpdateAssetInput, actorUserId: string) {
    const existing = await assetsRepo.findBare(id);
    if (!existing) throw notFound('Asset not found');
    if (input.categoryId && !(await assetsRepo.categoryExists(input.categoryId))) {
      throw badRequest('Category not found');
    }
    if (input.ownerDepartmentId && !(await assetsRepo.departmentExists(input.ownerDepartmentId))) {
      throw badRequest('Owner department not found');
    }

    const data: Prisma.AssetUncheckedUpdateInput = {
      name: input.name,
      categoryId: input.categoryId,
      serialNumber: input.serialNumber,
      acquisitionDate: input.acquisitionDate,
      acquisitionCost: input.acquisitionCost,
      condition: input.condition,
      location: input.location,
      isBookable: input.isBookable,
      photoUrl: input.photoUrl,
      ownerDepartmentId: input.ownerDepartmentId,
    };
    if (input.documents !== undefined) {
      data.documents = input.documents as unknown as Prisma.InputJsonValue;
    }

    const asset = await assetsRepo.update(id, data);
    emit({ type: 'AssetUpdated', actorUserId, entityType: 'Asset', entityId: id });
    return asset;
  },

  // Raw PNG for the label endpoint — encodes the asset tag.
  async qrImage(id: string) {
    const asset = await assetsRepo.findBare(id);
    if (!asset) throw notFound('Asset not found');
    return qrPngBuffer(asset.assetTag);
  },
};

// Fold the three relation arrays into a single time-ordered timeline.
function buildHistory(asset: AssetDetail): HistoryEntry[] {
  const entries: HistoryEntry[] = [];

  for (const a of asset.allocations) {
    entries.push({
      kind: 'ALLOCATION',
      id: a.id,
      at: a.allocatedAt,
      status: a.status,
      summary: a.allocatedToUser
        ? `Allocated to ${a.allocatedToUser.name}`
        : a.allocatedToDepartment
          ? `Allocated to ${a.allocatedToDepartment.name}`
          : 'Allocated',
      meta: {
        allocatedBy: a.allocatedByUser?.name,
        expectedReturnDate: a.expectedReturnDate,
        returnedAt: a.returnedAt,
        returnCondition: a.returnCondition,
      },
    });
  }

  for (const t of asset.transfers) {
    entries.push({
      kind: 'TRANSFER',
      id: t.id,
      at: t.createdAt,
      status: t.status,
      summary: `Transfer${t.fromUser ? ` from ${t.fromUser.name}` : ''} to ${t.toUser.name}`,
      meta: {
        requestedBy: t.requestedByUser?.name,
        approvedBy: t.approvedByUser?.name,
        decidedAt: t.decidedAt,
      },
    });
  }

  for (const m of asset.maintenance) {
    entries.push({
      kind: 'MAINTENANCE',
      id: m.id,
      at: m.createdAt,
      status: m.status,
      summary: m.description,
      meta: {
        priority: m.priority,
        raisedBy: m.raisedByUser?.name,
        technician: m.technicianUser?.name,
        resolvedAt: m.resolvedAt,
      },
    });
  }

  return entries.sort((a, b) => b.at.getTime() - a.at.getTime());
}
