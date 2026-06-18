import { StatusCodes } from 'http-status-codes';
import { settingService } from '../services/SettingService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

class SettingController {
  list = asyncHandler(async (_req, res) => {
    const data = await settingService.list();
    res.status(StatusCodes.OK).json({ success: true, data });
  });

  update = asyncHandler(async (req, res) => {
    const data = await settingService.update(req.params.key, req.body.value, req.body.group || 'general', req.user._id);
    res.status(StatusCodes.OK).json({ success: true, data });
  });
}

export const settingController = new SettingController();
