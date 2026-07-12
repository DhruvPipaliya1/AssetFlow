import { searchRepo } from './search.repo.js';

// Unified quick-search across the primary entities. Powers the ⌘K command
// palette; each group is capped so the response stays small.
export const searchService = {
  async search(q: string) {
    const term = q.trim();
    const [assets, employees, departments] = await Promise.all([
      searchRepo.assets(term),
      searchRepo.employees(term),
      searchRepo.departments(term),
    ]);
    return { assets, employees, departments };
  },
};
