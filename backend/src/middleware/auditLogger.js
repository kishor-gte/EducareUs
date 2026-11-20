import prisma from '../config/db.js';

export const auditLogger = (req, res, next) => {
  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

  if (!isStateChanging) {
    return next();
  }

  // Intercept res.json to capture response payload
  const originalJson = res.json;
  let responseBody = null;

  res.json = function (data) {
    responseBody = data;
    return originalJson.apply(this, arguments);
  };

  res.on('finish', async () => {
    // Only log successful modifications
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        const actorId = req.user ? req.user.id : null;
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.get('user-agent') || 'unknown';

        // Derive action and entityType from URL and method
        const urlParts = req.originalUrl.split('?')[0].split('/').filter(Boolean);
        // e.g. ['api', 'admin', 'enquiries', 'uuid', 'approve']
        const subResource = urlParts[2] || 'system';
        const targetId = urlParts[3] && !['reports', 'analytics', 'system-health'].includes(urlParts[3]) ? urlParts[3] : null;

        const action = `${req.method}_${subResource.toUpperCase()}${urlParts[4] ? '_' + urlParts[4].toUpperCase() : ''}`;
        const entityType = subResource.charAt(0).toUpperCase() + subResource.slice(1);

        // Sanitize sensitive body fields
        const sanitizedBody = req.body ? { ...req.body } : null;
        if (sanitizedBody) {
          delete sanitizedBody.password;
          delete sanitizedBody.passwordHash;
        }

        await prisma.auditLog.create({
          data: {
            actorId,
            action,
            entityType,
            entityId: targetId || (responseBody?.data?.id ? String(responseBody.data.id) : null),
            previousState: null,
            newState: sanitizedBody ? sanitizedBody : responseBody?.data || null,
            ipAddress: String(ipAddress),
            userAgent: String(userAgent),
          },
        });
      } catch (err) {
        console.error('⚠️ Failed to write audit log:', err.message);
      }
    }
  });

  next();
};
