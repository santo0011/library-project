import { StatusCodes } from 'http-status-codes';
import { dashboardService } from '../services/DashboardService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

class DashboardController {
  summary = asyncHandler(async (req, res) => {
    const data = await dashboardService.summary(req.user);
    res.status(StatusCodes.OK).json({ success: true, data });
  });
}

export const dashboardController = new DashboardController();
