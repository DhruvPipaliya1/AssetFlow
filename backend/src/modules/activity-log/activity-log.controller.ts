import { asyncHandler } from '../../lib/asyncHandler.js';
import { activityLogService } from './activity-log.service.js';

export const activityLogController = {
  list: asyncHandler(async (req, res) => {
    res.json(await activityLogService.list(req.query));
  }),
};
