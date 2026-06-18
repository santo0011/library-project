import { Router } from 'express';
import { Permissions } from '../config/roles.js';
import { studentController } from '../controllers/StudentController.js';
import { authenticate, authorizeRoles, authorizePermissions } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { createStudentValidation } from '../validations/authValidation.js';

export const studentRoutes = Router();

// IMPORTANT: Student self-service routes MUST come BEFORE /:id parameterized routes
// to avoid Express route conflict where /exams gets caught by /:id
studentRoutes.get('/exams', authenticate, authorizeRoles('Student'), studentController.getAvailableExams);
studentRoutes.post('/exams/:examId/start', authenticate, authorizeRoles('Student'), studentController.startExam);
studentRoutes.post('/exams/:examId/answer', authenticate, authorizeRoles('Student'), studentController.submitAnswer);
studentRoutes.post('/exams/:examId/submit', authenticate, authorizeRoles('Student'), studentController.submitExam);
studentRoutes.get('/results', authenticate, authorizeRoles('Student'), studentController.myResults);
studentRoutes.get('/results/:resultId', authenticate, authorizeRoles('Student'), studentController.getResultDetail);
studentRoutes.get('/dashboard', authenticate, authorizeRoles('Student'), studentController.myDashboard);

// Admin student management (parameterized routes at the end)
studentRoutes.get('/stats', authenticate, authorizePermissions(Permissions.DASHBOARD_READ), studentController.stats);
studentRoutes.get('/', authenticate, authorizePermissions(Permissions.STUDENTS_READ), studentController.list);
studentRoutes.post('/', authenticate, authorizePermissions(Permissions.STUDENTS_WRITE), createStudentValidation, validateRequest, studentController.create);
// Submissions must come before /:id to avoid route conflict
studentRoutes.get('/:studentId/submissions', authenticate, authorizePermissions(Permissions.RESULTS_READ), studentController.getStudentSubmissions);
studentRoutes.get('/:id', authenticate, authorizePermissions(Permissions.STUDENTS_READ), studentController.getById);
studentRoutes.patch('/:id', authenticate, authorizePermissions(Permissions.STUDENTS_WRITE), studentController.update);
studentRoutes.patch('/:id/reset-password', authenticate, authorizePermissions(Permissions.STUDENTS_WRITE), studentController.resetPassword);
studentRoutes.patch('/:id/toggle-status', authenticate, authorizePermissions(Permissions.STUDENTS_WRITE), studentController.toggleStatus);