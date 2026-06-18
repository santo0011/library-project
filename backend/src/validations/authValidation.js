import { body } from 'express-validator';

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

export const studentLoginValidation = [
  body('identifier').trim().notEmpty().withMessage('Student ID or Email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

export const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

export const changeEmailValidation = [
  body('newEmail').isEmail().normalizeEmail().withMessage('Valid email is required')
];

export const createStudentValidation = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2 to 80 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('mobile').trim().notEmpty().withMessage('Mobile number is required'),
  body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('dateOfBirth').optional({ values: 'falsy' }).isISO8601().withMessage('Valid date of birth is required')
];
