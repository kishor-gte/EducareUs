import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 characters long'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  RAZORPAY_KEY_ID: z.string().default(process.env.RAZORPAY_KEY_ID || process.env['razorpay.key.id'] || 'rzp_test_placeholder'),
  RAZORPAY_KEY_SECRET: z.string().default(process.env.RAZORPAY_KEY_SECRET || process.env['razorpay.key.secret'] || 'placeholder_secret'),
  RAZORPAY_WEBHOOK_SECRET: z.string().default('placeholder_webhook_secret'),
  PLATFORM_FEE_PERCENTAGE: z.string().default('0.00'),
  CSC_API_KEY: z.string().default(''),
  ABSTRACT_API_KEY: z.string().default(process.env.ABSTRACT_API_KEY || ''),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.string().default('587'),
  SMTP_SECURE: z.string().default('false'),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  EMAIL_FROM: z.string().default('"Educarrus Foundation" <admin@educarrus.org>'),
  GEMINI_API_KEY: z.string().default(process.env.GEMINI_API_KEY || ''),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
