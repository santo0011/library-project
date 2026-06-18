import { StatusCodes } from 'http-status-codes';
import { env } from '../config/env.js';
import { Roles } from '../config/roles.js';
import { authService } from '../services/AuthService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: env.isProduction,
  signed: true,
  maxAge: 7 * 24 * 60 * 60 * 1000
};

class AuthController {
  sendAuthResponse(res, result) {
    res.cookie('refreshToken', result.refreshToken, cookieOptions);
    res.status(StatusCodes.OK).json({ success: true, data: { user: result.user, accessToken: result.accessToken } });
  }

  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    this.sendAuthResponse(res, result);
  });

  adminLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password, [Roles.ADMIN]);
    this.sendAuthResponse(res, result);
  });

  studentLogin = asyncHandler(async (req, res) => {
    const { identifier, password } = req.body;
    const result = await authService.loginByIdentifier(identifier, password, [Roles.STUDENT]);
    this.sendAuthResponse(res, result);
  });

  refresh = asyncHandler(async (req, res) => {
    const refreshToken = req.signedCookies.refreshToken;
    const result = await authService.refresh(refreshToken);
    this.sendAuthResponse(res, result);
  });

  me = asyncHandler(async (req, res) => {
    res.status(StatusCodes.OK).json({ success: true, data: req.user });
  });

  logout = asyncHandler(async (req, res) => {
    await authService.logout(req.user._id);
    res.clearCookie('refreshToken', cookieOptions);
    res.status(StatusCodes.OK).json({ success: true, message: 'Logged out successfully' });
  });

  changePassword = asyncHandler(async (req, res) => {
    await authService.changePassword(req.user._id, req.body.currentPassword, req.body.newPassword);
    res.clearCookie('refreshToken', cookieOptions);
    res.status(StatusCodes.OK).json({ success: true, message: 'Password changed successfully' });
  });
}

export const authController = new AuthController();