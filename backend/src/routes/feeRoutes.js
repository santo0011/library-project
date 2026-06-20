import { Router } from 'express';
import { Permissions } from '../config/roles.js';
import { feeController } from '../controllers/FeeController.js';
import { authenticate, authorizePermissions, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  bulkAssignFeeValidation,
  bulkRemoveFeeValidation,
  createFeeTypeValidation,
  recordPaymentValidation,
  setTotalFeeValidation,
  updateFeeTypeValidation
} from '../validations/feeValidation.js';

export const feeRoutes = Router();

feeRoutes.use(authenticate);

feeRoutes.get('/mine', authorizeRoles('Student'), feeController.getMine);
feeRoutes.get('/types', authorizePermissions(Permissions.FEES_READ), feeController.listFeeTypes);
feeRoutes.post('/types', authorizePermissions(Permissions.FEES_WRITE), createFeeTypeValidation, validateRequest, feeController.createFeeType);
feeRoutes.patch('/types/:id', authorizePermissions(Permissions.FEES_WRITE), updateFeeTypeValidation, validateRequest, feeController.updateFeeType);
feeRoutes.delete('/types/:id', authorizePermissions(Permissions.FEES_WRITE), feeController.deleteFeeType);
feeRoutes.patch('/types/:id/toggle-status', authorizePermissions(Permissions.FEES_WRITE), feeController.toggleFeeTypeStatus);
feeRoutes.post('/types/bulk-toggle-status', authorizePermissions(Permissions.FEES_WRITE), feeController.bulkToggleFeeTypeStatus);
feeRoutes.post('/assign', authorizePermissions(Permissions.FEES_WRITE), bulkAssignFeeValidation, validateRequest, feeController.bulkAssign);
feeRoutes.post('/remove', authorizePermissions(Permissions.FEES_WRITE), bulkRemoveFeeValidation, validateRequest, feeController.bulkRemove);
feeRoutes.get('/', authorizePermissions(Permissions.FEES_READ), feeController.list);
feeRoutes.get('/students/:studentId', authorizePermissions(Permissions.FEES_READ), feeController.getByStudent);
feeRoutes.patch('/students/:studentId/total-fee', authorizePermissions(Permissions.FEES_WRITE), setTotalFeeValidation, validateRequest, feeController.setTotalFee);
feeRoutes.post('/students/:studentId/payments', authorizePermissions(Permissions.FEES_WRITE), recordPaymentValidation, validateRequest, feeController.recordPayment);
