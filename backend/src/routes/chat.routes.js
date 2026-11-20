import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import prisma from '../config/db.js';
import { handleChatMessage, getChatStatus } from '../controllers/chat.controller.js';

const router = Router();

const optionalAuth = async (req, res, next) => {
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
        select: { id: true, email: true, fullName: true, role: true },
      });
      if (user) {
        req.user = user;
      }
    }
  } catch {
    // Proceed as unauthenticated guest
  }
  next();
};

router.get('/status', getChatStatus);
router.post('/', optionalAuth, handleChatMessage);

export default router;
