import { Router } from 'express';
import { Permissions } from '../config/roles.js';
import { dashboardController } from '../controllers/DashboardController.js';
import { authenticate, authorizePermissions } from '../middlewares/authMiddleware.js';

export const dashboardRoutes = Router();

dashboardRoutes.get('/summary', authenticate, authorizePermissions(Permissions.DASHBOARD_READ), dashboardController.summary);
