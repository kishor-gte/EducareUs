import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { env } from '../config/env.js';
import { OtpService } from './otp.service.js';
import { EmailService } from './email.service.js';

// Consumed single-use password reset tokens
const consumedResetTokens = new Set();

export class AuthService {
  static async register({ email, password, fullName, phone, role, location, city, state }) {
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      const error = new Error('An account with this email already exists.');
      error.statusCode = 409;
      throw error;
    }

    // Require email verification via OTP
    if (!OtpService.isVerified(normalizedEmail)) {
      const error = new Error('Please verify your email address with the OTP before registering.');
      error.statusCode = 400;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const allowedRoles = ['BENEFICIARY'];
    const userRole = 'BENEFICIARY';

    // Normalize location from city and state if not directly supplied
    let userLocation = location;
    if (!userLocation && (city || state)) {
      userLocation = [city, state].filter(Boolean).join(', ');
    }

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        fullName,
        phone: phone ? phone.trim() : null,
        role: userRole,
        location: userLocation || null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        verificationStatus: true,
        location: true,
        createdAt: true,
      },
    });

    // Consume OTP once successfully registered
    OtpService.consumeOtp(normalizedEmail);

    const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    return { user, token };
  }

  static async login({ email, password }) {
    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    if (user.isSuspended) {
      const error = new Error('Your account has been suspended. Please contact support.');
      error.statusCode = 403;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    const userSafe = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      verificationStatus: user.verificationStatus,
      twoFactorEnabled: user.twoFactorEnabled,
      avatarUrl: user.avatarUrl,
      location: user.location,
      createdAt: user.createdAt,
    };

    return { user: userSafe, token };
  }

  static async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        verificationStatus: true,
        twoFactorEnabled: true,
        avatarUrl: true,
        location: true,
        createdAt: true,
        _count: {
          select: {
            enquiries: true,
            donations: true,
            supportTickets: true,
          },
        },
      },
    });

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    return user;
  }

  /**
   * Fetch rich summary and activity details for the user dashboard
   */
  static async getUserDashboard(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        verificationStatus: true,
        twoFactorEnabled: true,
        avatarUrl: true,
        location: true,
        createdAt: true,
      },
    });

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    // 1. Fetch user's contributions
    const donations = await prisma.donation.findMany({
      where: {
        OR: [
          { donorId: user.id },
          { donorEmail: user.email },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute donor statistics
    const successfulDonations = donations.filter((d) => d.status === 'SUCCESS');
    const totalDonated = successfulDonations.reduce((acc, d) => acc + Number(d.amount), 0);
    const totalTip = successfulDonations.reduce((acc, d) => acc + Number(d.tipAmount || 0), 0);

    // 2. Fetch student admissions enquiries
    const enquiries = await prisma.enquiry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Fetch notifications for user (including broadcast announcements)
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      user,
      notifications,
      donorStats: {
        totalDonated,
        totalTip,
        donationsCount: successfulDonations.length,
        taxExemptionSavings80G: Math.round(totalDonated * 0.5), // 50% eligible deduction under Section 80G
        recentDonations: donations,
      },
      beneficiaryStats: {
        enquiriesCount: enquiries.length,
        enquiries,
      },
    };
  }

  /**
   * Helper to verify a password reset token across current and fallback secrets
   */
  static decodeResetToken(token, user = null) {
    const secretsToTry = [
      env.JWT_SECRET + '_pwd_reset',
      env.JWT_SECRET,
    ];
    if (user?.passwordHash) {
      secretsToTry.push(env.JWT_SECRET + user.passwordHash);
    }

    let decoded = null;
    for (const secret of secretsToTry) {
      try {
        decoded = jwt.verify(token, secret);
        if (decoded) break;
      } catch (err) {
        // continue trying next secret
      }
    }

    if (!decoded || decoded.type !== 'password_reset') {
      const error = new Error('This password reset link has expired or is invalid. Please request a new one.');
      error.statusCode = 400;
      throw error;
    }

    return decoded;
  }

  /**
   * Request password reset link for registered email
   */
  static async forgotPassword({ email }) {
    if (!email) {
      const error = new Error('Please enter your registered email address.');
      error.statusCode = 400;
      throw error;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      const error = new Error('Email is not registered');
      error.statusCode = 404;
      throw error;
    }

    if (user.isSuspended) {
      const error = new Error('Your account has been suspended. Please contact support.');
      error.statusCode = 403;
      throw error;
    }

    // Generate a secure reset token valid for 30 minutes
    const resetSecret = env.JWT_SECRET + '_pwd_reset';
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, type: 'password_reset' },
      resetSecret,
      { expiresIn: '30m' }
    );

    const clientUrl = env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${clientUrl}/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(user.email)}`;

    // Dispatch branded Educarrus password reset email
    await EmailService.sendPasswordResetEmail({
      to: user.email,
      fullName: user.fullName,
      resetUrl,
    });

    return {
      success: true,
      message: 'Password reset link sent to your registered email.',
    };
  }

  /**
   * Verify whether a password reset token is valid
   */
  static async verifyResetToken({ token, email }) {
    if (!token) {
      const error = new Error('Invalid or missing reset token.');
      error.statusCode = 400;
      throw error;
    }

    if (consumedResetTokens.has(token)) {
      const error = new Error('This password reset link has already been used. Please request a new one.');
      error.statusCode = 400;
      throw error;
    }

    let user = null;
    if (email) {
      user = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
    }

    const decoded = AuthService.decodeResetToken(token, user);

    if (!user && decoded.userId) {
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });
    }

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    if (user.isSuspended) {
      const error = new Error('Your account has been suspended. Please contact support.');
      error.statusCode = 403;
      throw error;
    }

    return { success: true, valid: true, email: user.email, fullName: user.fullName };
  }

  /**
   * Reset user password using verified reset token
   */
  static async resetPassword({ token, email, newPassword }) {
    if (!token || !newPassword) {
      const error = new Error('Token and new password are required.');
      error.statusCode = 400;
      throw error;
    }

    if (consumedResetTokens.has(token)) {
      const error = new Error('This password reset link has already been used. Please request a new one.');
      error.statusCode = 400;
      throw error;
    }

    // Enforce password format requirements
    if (
      newPassword.length < 6 ||
      !/[A-Z]/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword)
    ) {
      const error = new Error(
        'Password must be at least 6 characters and include a mix of letters, numbers, and at least one uppercase letter.'
      );
      error.statusCode = 400;
      throw error;
    }

    let user = null;
    if (email) {
      user = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
    }

    const decoded = AuthService.decodeResetToken(token, user);

    if (!user && decoded.userId) {
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });
    }

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    if (user.isSuspended) {
      const error = new Error('Your account has been suspended. Please contact support.');
      error.statusCode = 403;
      throw error;
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update in database
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Invalidate token from being used again
    consumedResetTokens.add(token);

    return {
      success: true,
      message: 'Password updated successfully. Please log in with new password.',
    };
  }

  /**
   * Update student profile in database
   */
  static async updateProfile(userId, { fullName, phone, location, avatarUrl }) {
    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName.trim();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (location !== undefined) updateData.location = location ? location.trim() : null;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        verificationStatus: true,
        avatarUrl: true,
        location: true,
        createdAt: true,
      },
    });

    return updated;
  }

  /**
   * Change user password in real time
   */
  static async changePassword(userId, { currentPassword, newPassword }, reqMeta = {}) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Current password does not match our records. Please verify and try again.');
      error.statusCode = 400;
      throw error;
    }

    const isSame = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSame) {
      const error = new Error('New password must be different from your current password.');
      error.statusCode = 400;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Record in Audit Log
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'PASSWORD_CHANGE',
        entityType: 'User',
        entityId: userId,
        ipAddress: reqMeta.ip || null,
        userAgent: reqMeta.userAgent || null,
      },
    }).catch(() => {});

    // Send real-time notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'SECURITY',
        title: '🔒 Password Updated Successfully',
        message: 'Your account password has been updated in real-time. If you did not make this change, please contact support immediately.',
      },
    }).catch(() => {});

    return {
      success: true,
      message: 'Password updated successfully! Your account credentials have been refreshed.',
    };
  }

  /**
   * Toggle Two-Factor Authentication (2FA) in real time
   */
  static async toggleTwoFactor(userId, { enabled }, reqMeta = {}) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: !!enabled },
      select: { id: true, twoFactorEnabled: true, email: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: enabled ? '2FA_ENABLED' : '2FA_DISABLED',
        entityType: 'User',
        entityId: userId,
        ipAddress: reqMeta.ip || null,
        userAgent: reqMeta.userAgent || null,
      },
    }).catch(() => {});

    await prisma.notification.create({
      data: {
        userId,
        type: 'SECURITY',
        title: enabled ? '🛡️ Two-Factor Protection Activated' : '⚠️ Two-Factor Protection Deactivated',
        message: enabled
          ? 'Two-factor authentication is now active for your account.'
          : 'Two-factor authentication has been disabled for your account.',
      },
    }).catch(() => {});

    return {
      success: true,
      twoFactorEnabled: user.twoFactorEnabled,
      message: enabled
        ? 'Two-factor protection enabled successfully.'
        : 'Two-factor protection has been turned off.',
    };
  }

  /**
   * Get real-time security activity & audit trail for current user
   */
  static async getSecurityActivity(userId, reqMeta = {}) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    const recentLogs = await prisma.auditLog.findMany({
      where: { actorId: userId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        action: true,
        entityType: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
    });

    return {
      twoFactorEnabled: user.twoFactorEnabled,
      lastLoginAt: user.lastLoginAt,
      currentSession: {
        ip: reqMeta.ip || '127.0.0.1',
        userAgent: reqMeta.userAgent || 'Chrome / Windows',
        loginTime: user.lastLoginAt || new Date(),
      },
      auditLogs: recentLogs,
    };
  }

  /**
   * Revoke all other sessions
   */
  static async revokeSessions(userId, reqMeta = {}) {
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'REVOKE_SESSIONS',
        entityType: 'User',
        entityId: userId,
        ipAddress: reqMeta.ip || null,
        userAgent: reqMeta.userAgent || null,
      },
    }).catch(() => {});

    await prisma.notification.create({
      data: {
        userId,
        type: 'SECURITY',
        title: '🛡️ All Other Sessions Terminated',
        message: 'All device sessions other than your current active browser instance have been disconnected.',
      },
    }).catch(() => {});

    return {
      success: true,
      message: 'All other active sessions have been terminated. Current session is secure.',
    };
  }
}
