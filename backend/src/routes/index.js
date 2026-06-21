import { Router } from 'express';
import { authRoutes } from './authRoutes.js';
import { dashboardRoutes } from './dashboardRoutes.js';
import { examRoutes } from './examRoutes.js';
import { feeRoutes } from './feeRoutes.js';
import { settingRoutes } from './settingRoutes.js';
import { studentRoutes } from './studentRoutes.js';

export const apiRoutes = Router();

apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/dashboard', dashboardRoutes);
apiRoutes.use('/exams', examRoutes);
apiRoutes.use('/fees', feeRoutes);
apiRoutes.use('/students', studentRoutes);
apiRoutes.use('/settings', settingRoutes);
