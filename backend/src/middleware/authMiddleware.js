import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import prisma from '../config/db.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        verificationStatus: true,
        isSuspended: true,
        twoFactorEnabled: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or has been deactivated.',
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended. Please contact administrator support.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid or malformed authentication token.',
    });
  }
};

// Optional auth for public routes (e.g. guest or authenticated donor)
export const optionalAuthenticate = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isSuspended: true,
        },
      });
      if (user && !user.isSuspended) {
        req.user = user;
      }
    }
  } catch {
    // Ignore invalid token for optional auth
  }
  next();
};
