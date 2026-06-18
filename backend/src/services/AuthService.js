import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import { defaultRolePermissions, Roles } from '../config/roles.js';
import { userRepository } from '../repositories/UserRepository.js';
import { AppError } from '../utils/AppError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';

class AuthService {
  async seedDefaultAdmin() {
    let admin = await userRepository.findOne({ role: Roles.ADMIN });
    if (admin) {
      // Update existing admin permissions to include all current permissions
      if (JSON.stringify(admin.permissions) !== JSON.stringify(defaultRolePermissions[Roles.ADMIN])) {
        admin.permissions = defaultRolePermissions[Roles.ADMIN];
        await admin.save();
        console.log('Updated admin permissions.');
      } else {
        console.log('Admin already exists, skipping seed.');
      }
      return;
    }
    await userRepository.create({
      name: 'System Admin',
      email: 'santo@gmail.com',
      password: '123456',
      role: Roles.ADMIN,
      permissions: defaultRolePermissions[Roles.ADMIN],
      status: 'active'
    });
    console.log('Default admin seeded: santo@gmail.com');
  }

  async login(email, password, allowedRoles = []) {
    const user = await userRepository.findByEmailWithPassword(email);
    if (!user) {
      throw new AppError('Account not found.', StatusCodes.UNAUTHORIZED);
    }
    if (user.status !== 'active') {
      throw new AppError('Your account has been deactivated. Please contact the administrator.', StatusCodes.FORBIDDEN);
    }
    const isValid = await user.comparePassword(password);
    if (!isValid) throw new AppError('Invalid password.', StatusCodes.UNAUTHORIZED);
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      throw new AppError('This account cannot sign in from this portal', StatusCodes.FORBIDDEN);
    }
    user.lastLoginAt = new Date();
    const tokens = await this.issueTokens(user);
    return { user, ...tokens };
  }

  async loginByIdentifier(identifier, password, allowedRoles = []) {
    const user = await userRepository.findByStudentIdOrEmail(identifier);
    if (!user) {
      throw new AppError('Account not found.', StatusCodes.UNAUTHORIZED);
    }
    if (user.status !== 'active') {
      throw new AppError('Your account has been deactivated. Please contact the administrator.', StatusCodes.FORBIDDEN);
    }
    const isValid = await user.comparePassword(password);
    if (!isValid) throw new AppError('Invalid password.', StatusCodes.UNAUTHORIZED);
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      throw new AppError('This account cannot sign in from this portal', StatusCodes.FORBIDDEN);
    }
    user.lastLoginAt = new Date();
    const tokens = await this.issueTokens(user);
    return { user, ...tokens };
  }

  async issueTokens(user) {
    const payload = { sub: user._id.toString(), role: user.role, permissions: user.permissions };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ sub: user._id.toString() });
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();
    return { accessToken, refreshToken };
  }

  async refresh(refreshToken) {
    if (!refreshToken) throw new AppError('Refresh token is required', StatusCodes.UNAUTHORIZED);
    const decoded = verifyRefreshToken(refreshToken);
    const user = await userRepository.findById(decoded.sub).select('+refreshTokenHash');
    if (!user || user.status !== 'active' || !user.refreshTokenHash) {
      throw new AppError('Invalid refresh token', StatusCodes.UNAUTHORIZED);
    }
    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) throw new AppError('Invalid refresh token', StatusCodes.UNAUTHORIZED);
    return { user, ...(await this.issueTokens(user)) };
  }

  async logout(userId) {
    await userRepository.updateById(userId, { refreshTokenHash: null });
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findById(userId).select('+password');
    if (!user) throw new AppError('User not found', StatusCodes.NOT_FOUND);
    const valid = await user.comparePassword(currentPassword);
    if (!valid) throw new AppError('Current password is incorrect', StatusCodes.BAD_REQUEST);
    user.password = newPassword;
    user.refreshTokenHash = undefined;
    await user.save();
  }

  async updateEmail(userId, newEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      throw new AppError('Invalid email format', StatusCodes.BAD_REQUEST);
    }
    const existing = await userRepository.findOne({ email: newEmail.toLowerCase(), _id: { $ne: userId } });
    if (existing) {
      throw new AppError('This email is already in use by another account', StatusCodes.CONFLICT);
    }
    const user = await userRepository.updateById(userId, {
      email: newEmail.toLowerCase(),
      refreshTokenHash: null
    });
    if (!user) throw new AppError('User not found', StatusCodes.NOT_FOUND);
    return user;
  }
}

export const authService = new AuthService();