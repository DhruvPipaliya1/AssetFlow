import { prisma } from './prisma.js';
import { SETTINGS } from './settings.js';

// Atomic asset tag from the Postgres sequence created in the constraints
// migration. Never derive from count(*) (races + gaps). -> AF-0001, AF-0002...
export async function nextAssetTag(): Promise<string> {
  const rows = await prisma.$queryRaw<{ nextval: bigint }[]>`SELECT nextval('asset_tag_seq')`;
  const n = Number(rows[0]?.nextval ?? 0);
  return `${SETTINGS.tagPrefix}-${String(n).padStart(4, '0')}`;
}
