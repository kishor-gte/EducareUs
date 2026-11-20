import path from 'path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security Headers (configured to allow inline styles, cross-origin images, and admin dashboards)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
  })
);

// Rate Limiting (General API protection)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});
app.use('/api', limiter);

// Cookie Parser
app.use(cookieParser());

// Preserve raw body for Webhooks cryptographic HMAC verification + expand payload limits for rich text & cover images
app.use(
  express.json({
    limit: '20mb',
    verify: (req, res, buf) => {
      if (req.originalUrl.includes('/api/webhooks')) {
        req.rawBody = buf;
      }
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads directory for publications cover images & assets
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Liveness / Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'educarrus-backend',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api', apiRoutes);

// 404 Route Not Found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.method} ${req.originalUrl}' does not exist.`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
