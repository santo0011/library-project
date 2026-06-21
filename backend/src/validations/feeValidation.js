import { body } from 'express-validator';

export const setTotalFeeValidation = [
  body('totalFee')
    .isFloat({ min: 0 })
    .withMessage('Total fee must be zero or greater')
    .toFloat()
];

export const recordPaymentValidation = [
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Payment amount must be greater than zero')
    .toFloat(),
  body('totalFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total fee must be zero or greater')
    .toFloat(),
  body('feeType')
    .optional({ checkFalsy: true })
    .isMongoId()
    .withMessage('Invalid fee type selected'),
  body('paymentMode')
    .optional()
    .isIn(['Cash', 'Online', 'Cheque', 'Bank Transfer', 'UPI', 'Other'])
    .withMessage('Invalid payment mode'),
  body('paymentDate')
    .optional()
    .isISO8601()
    .withMessage('Payment date must be a valid date'),
  body('transactionId')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Transaction ID must be 100 characters or fewer'),
  body('remarks')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 300 })
    .withMessage('Remarks must be 300 characters or fewer')
];

export const createFeeTypeValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be zero or greater')
    .toFloat(),
  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 300 })
    .withMessage('Description must be 300 characters or fewer'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Active status must be true or false')
    .toBoolean()
];

export const updateFeeTypeValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount must be zero or greater')
    .toFloat(),
  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 300 })
    .withMessage('Description must be 300 characters or fewer'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Active status must be true or false')
    .toBoolean()
];

export const bulkAssignFeeValidation = [
  body('feeTypeId')
    .isMongoId()
    .withMessage('Fee type is required'),
  body('studentIds')
    .isArray({ min: 1 })
    .withMessage('Select at least one student'),
  body('studentIds.*')
    .isMongoId()
    .withMessage('Invalid student selected')
];

export const bulkRemoveFeeValidation = [
  body('feeTypeId')
    .isMongoId()
    .withMessage('Fee type is required'),
  body('studentIds')
    .isArray({ min: 1 })
    .withMessage('Select at least one student'),
  body('studentIds.*')
    .isMongoId()
    .withMessage('Invalid student selected')
];
