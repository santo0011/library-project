import { StatusCodes } from 'http-status-codes';
import { env } from '../config/env.js';

export const notFound = (req, _res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = StatusCodes.NOT_FOUND;
  next(error);
};

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const payload = {
    success: false,
    message: error.isOperational ? error.message : 'Internal server error'
  };

  if (error.details) payload.details = error.details;
  if (!env.isProduction) payload.stack = error.stack;

  res.status(statusCode).json(payload);
};
