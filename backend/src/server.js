import app from './app.js';
import { env } from './config/env.js';
import prisma from './config/db.js';

const PORT = env.PORT || 5000;

async function startServer() {
  try {
    // Attempt PostgreSQL database connection
    try {
      await prisma.$connect();
      console.log('✅ PostgreSQL database connected successfully via Prisma');
    } catch (dbErr) {
      console.warn('⚠️ Warning: Could not connect to PostgreSQL database.');
      console.warn(`   Check that PostgreSQL is running and DATABASE_URL in .env is correct: ${dbErr.message}`);
    }

    const server = app.listen(PORT, () => {
      console.log(`🚀 Educarrus Backend running in [${env.NODE_ENV}] mode on http://localhost:${PORT}`);
      console.log(`📊 Health Check: http://localhost:${PORT}/health`);
      console.log(`📡 API Endpoints base: http://localhost:${PORT}/api`);
    });

    const shutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('🔌 Database disconnected. Process terminated.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
