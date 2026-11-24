import { AuthService } from '../services/auth.service.js';
import { OtpService } from '../services/otp.service.js';

export class AuthController {
  static async sendOtp(req, res, next) {
    try {
      const { email } = req.body;
      const result = await OtpService.sendOtp(email);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async verifyOtp(req, res, next) {
    try {
      const { email, otp } = req.body;
      const result = await OtpService.verifyOtp(email, otp);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const result = await AuthService.login(req.body);
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(req, res) {
    res.clearCookie('token');
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }

  static async getMe(req, res, next) {
    try {
      const profile = await AuthService.getProfile(req.user.id);
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getUserDashboard(req, res, next) {
    try {
      const dashboard = await AuthService.getUserDashboard(req.user.id);
      res.status(200).json({
        success: true,
        data: dashboard,
      });
    } catch (err) {
      next(err);
    }
  }

  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await AuthService.forgotPassword({ email });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async verifyResetToken(req, res, next) {
    try {
      const { token, email } = req.body;
      const result = await AuthService.verifyResetToken({ token, email });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const { token, email, newPassword } = req.body;
      const result = await AuthService.resetPassword({ token, email, newPassword });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const updatedUser = await AuthService.updateProfile(req.user.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Student profile updated successfully',
        data: updatedUser,
      });
    } catch (err) {
      next(err);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const reqMeta = {
        ip: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'],
      };
      const result = await AuthService.changePassword(
        req.user.id,
        { currentPassword, newPassword },
        reqMeta
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async toggleTwoFactor(req, res, next) {
    try {
      const { enabled } = req.body;
      const reqMeta = {
        ip: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'],
      };
      const result = await AuthService.toggleTwoFactor(req.user.id, { enabled }, reqMeta);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getSecurityActivity(req, res, next) {
    try {
      const reqMeta = {
        ip: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'],
      };
      const result = await AuthService.getSecurityActivity(req.user.id, reqMeta);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async revokeSessions(req, res, next) {
    try {
      const reqMeta = {
        ip: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'],
      };
      const result = await AuthService.revokeSessions(req.user.id, reqMeta);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
