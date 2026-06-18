import { StatusCodes } from 'http-status-codes';
import { Roles } from '../config/roles.js';
import { userRepository } from '../repositories/UserRepository.js';
import { AppError } from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/jwt.js';

export const authenticate = async (req, _res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new AppError('Authentication required', StatusCodes.UNAUTHORIZED);

    const decoded = verifyAccessToken(token);
    const user = await userRepository.findById(decoded.sub);
    if (!user || user.status !== 'active') {
      throw new AppError('Authentication required', StatusCodes.UNAUTHORIZED);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError('Invalid or expired token', StatusCodes.UNAUTHORIZED));
  }
};

export const authorizeRoles = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new AppError('Authentication required', StatusCodes.UNAUTHORIZED));
  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have access to this resource', StatusCodes.FORBIDDEN));
  }
  next();
};


export const authorizePermissions = (...permissions) => (req, _res, next) => {
  if (!req.user) return next(new AppError('Authentication required', StatusCodes.UNAUTHORIZED));
  // Admin has all permissions - bypass check
  if (req.user.role === Roles.ADMIN) return next();
  const userPermissions = req.user.permissions || [];
  const hasPermission = permissions.every((permission) => userPermissions.includes(permission));
  if (!hasPermission) return next(new AppError('Insufficient permissions', StatusCodes.FORBIDDEN));
  next();
};

