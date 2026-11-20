import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
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
  WHATSAPP_BUSINESS_PHONE_NUMBER: z
    .string()
    .default(process.env.WHATSAPP_BUSINESS_PHONE_NUMBER || '918147647779'),
  WHATSAPP_TOKEN: z
    .string()
    .default(process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN || ''),
  WHATSAPP_ACCESS_TOKEN: z
    .string()
    .default(process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN || ''),
  WHATSAPP_PHONE_NUMBER_ID: z.string().default(process.env.WHATSAPP_PHONE_NUMBER_ID || ''),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z
    .string()
    .default(process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || ''),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z
    .string()
    .default(process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'educare_webhook_verify_token_2026'),
  META_APP_SECRET: z.string().default(process.env.META_APP_SECRET || ''),
  WHATSAPP_API_VERSION: z.string().default(process.env.WHATSAPP_API_VERSION || 'v21.0'),
  WHATSAPP_TEMPLATE_NAME: z
    .string()
    .default(process.env.WHATSAPP_TEMPLATE_NAME || 'educare_notification'),
  WHATSAPP_TEMPLATE_LANGUAGE: z
    .string()
    .default(process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US'),
  WHATSAPP_GATEWAY_URL: z.string().default(process.env.WHATSAPP_GATEWAY_URL || ''),
  ULTRAMSG_INSTANCE_ID: z.string().default(process.env.ULTRAMSG_INSTANCE_ID || ''),
  ULTRAMSG_TOKEN: z.string().default(process.env.ULTRAMSG_TOKEN || ''),
  GREEN_API_INSTANCE_ID: z.string().default(process.env.GREEN_API_INSTANCE_ID || ''),
  GREEN_API_TOKEN: z.string().default(process.env.GREEN_API_TOKEN || ''),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
