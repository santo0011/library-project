import { Router } from 'express';
import { Permissions } from '../config/roles.js';
import { settingController } from '../controllers/SettingController.js';
import { authenticate, authorizePermissions } from '../middlewares/authMiddleware.js';

export const settingRoutes = Router();

settingRoutes.use(authenticate);
settingRoutes.get('/', authorizePermissions(Permissions.SETTINGS_READ), settingController.list);
settingRoutes.patch(
  '/:key',
  authorizePermissions(Permissions.SETTINGS_UPDATE),
  settingController.update
);