import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  console.error('💥 Error Stack:', err);

  // Prisma Known Request Error handling
  if (err.code === 'P2002') {
    const fields = err.meta?.target || ['field'];
    return res.status(409).json({
      success: false,
      message: `A record with this ${Array.isArray(fields) ? fields.join(', ') : fields} already exists.`,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: err.meta?.cause || 'The requested resource was not found.',
    });
  }

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
