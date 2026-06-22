import { Router } from 'express';
import { examController } from '../controllers/ExamController.js';
import { authenticate, authorizePermissions } from '../middlewares/authMiddleware.js';

export const examRoutes = Router();

examRoutes.use(authenticate);

// Questions CRUD - MUST come before /:id routes to avoid route conflicts
examRoutes.get('/all/questions', authorizePermissions('questions:read'), examController.getQuestions);
examRoutes.post('/all/questions', authorizePermissions('questions:write'), examController.createQuestion);
examRoutes.put('/all/questions/:questionId', authorizePermissions('questions:write'), examController.updateQuestion);
examRoutes.delete('/all/questions/:questionId', authorizePermissions('questions:write'), examController.deleteQuestion);

// Exams CRUD
examRoutes.get('/', authorizePermissions('exams:read'), examController.list);
examRoutes.post('/', authorizePermissions('exams:write'), examController.create);
examRoutes.get('/:id', authorizePermissions('exams:read'), examController.getById);
examRoutes.put('/:id', authorizePermissions('exams:write'), examController.update);
examRoutes.delete('/:id', authorizePermissions('exams:write'), examController.remove);
examRoutes.post('/:id/questions', authorizePermissions('exams:write'), examController.addQuestions);
examRoutes.post('/:id/questions/bulk', authorizePermissions('exams:write'), examController.bulkImportQuestions);
examRoutes.post('/:id/questions/bulk-delete', authorizePermissions('exams:write'), examController.bulkDeleteQuestions);
