import { validationResult } from 'express-validator';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../utils/AppError.js';

export const validateRequest = (req, _res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  next(
    new AppError(
      'Validation failed',
      StatusCodes.UNPROCESSABLE_ENTITY,
      errors.array().map((error) => ({ field: error.path, message: error.msg }))
    )
  );
};
