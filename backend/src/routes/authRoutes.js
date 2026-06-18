import { Router } from 'express';
import { authController } from '../controllers/AuthController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { loginValidation, changePasswordValidation, changeEmailValidation, studentLoginValidation } from '../validations/authValidation.js';

export const authRoutes = Router();

authRoutes.post('/login', loginValidation, validateRequest, authController.login);
authRoutes.post('/admin/login', loginValidation, validateRequest, authController.adminLogin);
authRoutes.post('/student/login', studentLoginValidation, validateRequest, authController.studentLogin);
authRoutes.post('/refresh', authController.refresh);
authRoutes.get('/me', authenticate, authController.me);
authRoutes.post('/logout', authenticate, authController.logout);
authRoutes.post('/change-password', authenticate, changePasswordValidation, validateRequest, authController.changePassword);
authRoutes.post('/change-email', authenticate, changeEmailValidation, validateRequest, authController.changeEmail);
