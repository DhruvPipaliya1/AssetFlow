import { SETTINGS } from './settings.js';

// Reusable pagination for directory-style list endpoints (assets, employees,
// logs). Parses ?page & ?take with sane caps.
export interface Pagination {
  skip: number;
  take: number;
  page: number;
}

export function parsePagination(query: Record<string, unknown>): Pagination {
  const takeRaw = Number(query.take ?? SETTINGS.pagination.defaultTake);
  const take = Math.min(
    Number.isFinite(takeRaw) && takeRaw > 0 ? takeRaw : SETTINGS.pagination.defaultTake,
    SETTINGS.pagination.maxTake,
  );
  const pageRaw = Number(query.page ?? 1);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  return { skip: (page - 1) * take, take, page };
}

/** Wrap a list result with pagination metadata. */
export function paginated<T>(items: T[], total: number, p: Pagination) {
  return { items, total, page: p.page, take: p.take, pages: Math.ceil(total / p.take) };
}
