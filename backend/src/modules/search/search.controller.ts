import { asyncHandler } from '../../lib/asyncHandler.js';
import { searchService } from './search.service.js';

export const searchController = {
  search: asyncHandler(async (req, res) => {
    res.json(await searchService.search(req.query.q as string));
  }),
};
