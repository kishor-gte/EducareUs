import dns from 'node:dns/promises';
import prisma from '../config/db.js';
import { env } from '../config/env.js';
import { EmailService } from './email.service.js';

// Common disposable/throwaway email providers
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'sharklasers.com',
  'yopmail.com',
  'trashmail.com',
  'dispostable.com',
  'getairmail.com',
  'fakeinbox.com',
  'temp-mail.org',
  'throwawaymail.com',
  'mohmal.com',
  'mytemp.email',
  'generator.email',
  'fakemailgenerator.com',
  'emailondeck.com',
  'crazymailing.com',
  'nada.ltd',
  'inboxbear.com',
  'burnermail.io',
  'getnada.com',
  'maildrop.cc',
  'discard.email',
  'throwaway.email',
  'mytrashmail.com',
  'tempinbox.com',
  'instantemailaddress.com',
  'harakirimail.com',
  'binkmail.com',
  'safetymail.info',
  'tagmail.com',
  'jetable.org',
]);

// Common domain typos
const DOMAIN_TYPOS = {
  'gmial.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmeil.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmaik.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'hotmali.com': 'hotmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yaho.co.in': 'yahoo.co.in',
  'outlok.com': 'outlook.com',
  'outllok.com': 'outlook.com',
  'outlok.co': 'outlook.com',
};

// Obvious test/fake/dummy username indicators and keyboard mash patterns
const FAKE_USER_PATTERNS = [
  /test/i,
  /fake/i,
  /dummy/i,
  /random/i,
  /nonexist/i,
  /invalid/i,
  /temp(?:user|mail)?/i,
  /example/i,
  /sample/i,
  /unknown/i,
  /noemail/i,
  /noreply/i,
  /notreal/i,
  /nobody/i,
  /^hotel\d*$/i,
  /^shop\d*$/i,
  /^store\d*$/i,
  /^room\d*$/i,
  /^office\d*$/i,
  /^school\d*$/i,
  /^class\d*$/i,
  /^desk\d*$/i,
  /^place\d*$/i,
  /^guest\d*$/i,
  /^client\d*$/i,
  /^host\d*$/i,
  /^demo\d*$/i,
  /^asdf/i,
  /^qwerty/i,
  /^zxcv/i,
  /^1234/i,
  /(.)\1{4,}/, // 5+ repeated characters (e.g. aaaaa, 00000)
  /^[bcdfghjklmnpqrstvwxyz]{6,}$/i, // 6+ consecutive consonants without vowels (keyboard smash)
];

/**
 * Validate that an email actually exists in real time using AbstractAPI, DNS MX records, and provider rules
 */
async function validateRealEmail(email) {
  if (!email || typeof email !== 'string') {
    const err = new Error('No Email Exist');
    err.statusCode = 400;
    throw err;
  }

  const normalized = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(normalized)) {
    const err = new Error('No Email Exist');
    err.statusCode = 400;
    throw err;
  }

  const [username, domain] = normalized.split('@');

  // Check for common typos
  if (DOMAIN_TYPOS[domain]) {
    const err = new Error('No Email Exist');
    err.statusCode = 400;
    throw err;
  }

  // Check for disposable domains
  if (DISPOSABLE_DOMAINS.has(domain)) {
    const err = new Error('No Email Exist');
    err.statusCode = 400;
    throw err;
  }

  // Check for obvious fake/dummy usernames
  for (const pattern of FAKE_USER_PATTERNS) {
    if (pattern.test(username)) {
      const err = new Error('No Email Exist');
      err.statusCode = 400;
      throw err;
    }
  }

  // Provider-specific rules (Gmail, etc.)
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    if (username.length < 6 || username.length > 30) {
      const err = new Error('No Email Exist');
      err.statusCode = 400;
      throw err;
    }
    if (username.startsWith('.') || username.endsWith('.') || username.includes('..')) {
      const err = new Error('No Email Exist');
      err.statusCode = 400;
      throw err;
    }
    if (!/^[a-z0-9.]+$/.test(username)) {
      const err = new Error('No Email Exist');
      err.statusCode = 400;
      throw err;
    }
  } else if (domain === 'yahoo.com' || domain === 'yahoo.co.in') {
    if (username.length < 4 || username.length > 32) {
      const err = new Error('No Email Exist');
      err.statusCode = 400;
      throw err;
    }
  } else if (domain === 'outlook.com' || domain === 'hotmail.com') {
    if (!/^[a-z]/.test(username)) {
      const err = new Error('No Email Exist');
      err.statusCode = 400;
      throw err;
    }
  }

  // 1. Check with user-configured AbstractAPI if key is available
  if (env.ABSTRACT_API_KEY) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const abstractUrl = `https://emailvalidation.abstractapi.com/v1/?api_key=${env.ABSTRACT_API_KEY}&email=${encodeURIComponent(normalized)}`;
      const res = await fetch(abstractUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        console.log(`[AbstractAPI Check for ${normalized}]:`, data.deliverability, 'Score:', data.quality_score);

        const isUndeliverable =
          data.deliverability === 'UNDELIVERABLE' ||
          data.is_smtp_valid?.value === false ||
          data.is_smtp_valid === false ||
          data.is_mx_found?.value === false ||
          data.is_mx_found === false ||
          data.is_valid_format?.value === false ||
          data.is_valid_format === false ||
          data.is_disposable_email?.value === true ||
          data.is_disposable_email === true ||
          (typeof data.quality_score === 'number' && data.quality_score < 0.25);

        if (isUndeliverable) {
          const err = new Error('No Email Exist');
          err.statusCode = 400;
          throw err;
        }
      }
    } catch (apiErr) {
      if (apiErr.message && apiErr.message.includes('No Email Exist')) {
        throw apiErr;
      }
      console.warn('[AbstractAPI Warning]:', apiErr.message);
    }
  }

  // 2. Live Authoritative DNS Mail Exchange (MX) record lookup
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (!Array.isArray(mxRecords) || mxRecords.length === 0) {
      const err = new Error('No Email Exist');
      err.statusCode = 400;
      throw err;
    }
  } catch (dnsErr) {
    if (dnsErr.code === 'ENOTFOUND' || dnsErr.code === 'ENODATA' || dnsErr.code === 'NXDOMAIN') {
      const err = new Error('No Email Exist');
      err.statusCode = 400;
      throw err;
    }
    if (dnsErr.message && dnsErr.message.includes('No Email Exist')) {
      throw dnsErr;
    }
    console.warn(`DNS check warning for ${domain}:`, dnsErr.message);
  }

  // 3. Live API verification check with rapid-email-verifier (with 2s timeout fallback)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const apiRes = await fetch('https://rapid-email-verifier.fly.dev/api/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalized }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (apiRes.ok) {
      const apiData = await apiRes.json();
      if (
        apiData.status === 'INVALID_DOMAIN' ||
        apiData.status === 'NO_MX_RECORDS' ||
        apiData.status === 'INVALID_FORMAT' ||
        apiData.status === 'DISPOSABLE' ||
        apiData.validations?.mailbox_exists === false ||
        apiData.validations?.domain_exists === false ||
        apiData.validations?.mx_records === false
      ) {
        const err = new Error('No Email Exist');
        err.statusCode = 400;
        throw err;
      }
    }
  } catch (apiErr) {
    if (apiErr.message && apiErr.message.includes('No Email Exist')) {
      throw apiErr;
    }
  }

  return true;
}

// Map: email -> { otp, expiresAt, verified, attempts }
const otpStore = new Map();

// Periodic cleanup of expired OTPs every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of otpStore.entries()) {
    if (data.expiresAt < now) {
      otpStore.delete(email);
    }
  }
}, 15 * 60 * 1000);

export class OtpService {
  /**
   * Generate 6-digit OTP and send via email
   */
  static async sendOtp(email) {
    if (!email || !email.includes('@')) {
      const err = new Error('No Email Exist');
      err.statusCode = 400;
      throw err;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Verify that the email address actually exists in real time
    await validateRealEmail(normalizedEmail);

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      const err = new Error('An account with this email already exists. Please log in.');
      err.statusCode = 409;
      throw err;
    }

    // Check resend limit (maximum 3 resends allowed)
    const existingRecord = otpStore.get(normalizedEmail);
    const currentResends = existingRecord ? (existingRecord.resendCount || 0) : 0;

    if (existingRecord && currentResends >= 3) {
      const err = new Error('You can resend OTP only 3 times. Please check your spam folder or try again later.');
      err.statusCode = 429;
      throw err;
    }

    const newResendCount = existingRecord ? currentResends + 1 : 0;

    // Generate secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(normalizedEmail, {
      otp,
      expiresAt,
      verified: false,
      attempts: 0,
      resendCount: newResendCount,
    });

    // Send email with rich Educarrus template
    try {
      await EmailService.sendOtpEmail({ to: normalizedEmail, otp });
    } catch (sendErr) {
      // Revert stored OTP if delivery failed
      otpStore.delete(normalizedEmail);

      console.warn(`[OTP Send Failure for ${normalizedEmail}]:`, sendErr.message);

      // Any delivery or recipient failure means the email doesn't exist
      const err = new Error('No Email Exist');
      err.statusCode = 400;
      throw err;
    }

    return {
      success: true,
      resendCount: newResendCount,
      remainingResends: Math.max(0, 3 - newResendCount),
      message: `OTP sent successfully to ${normalizedEmail}. Valid for 10 minutes.`,
    };
  }

  /**
   * Verify the entered OTP
   */
  static async verifyOtp(email, enteredOtp) {
    if (!email || !enteredOtp) {
      const err = new Error('Email and OTP are required.');
      err.statusCode = 400;
      throw err;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = enteredOtp.trim();

    const record = otpStore.get(normalizedEmail);

    if (!record) {
      const err = new Error('No OTP requested for this email. Please click Send OTP.');
      err.statusCode = 400;
      throw err;
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(normalizedEmail);
      const err = new Error('OTP has expired. Please request a new one.');
      err.statusCode = 400;
      throw err;
    }

    if (record.attempts >= 5) {
      otpStore.delete(normalizedEmail);
      const err = new Error('Too many incorrect attempts. Please request a new OTP.');
      err.statusCode = 429;
      throw err;
    }

    if (record.otp !== cleanOtp) {
      record.attempts += 1;
      const err = new Error('Invalid OTP');
      err.statusCode = 400;
      throw err;
    }

    // Mark verified
    record.verified = true;

    return {
      success: true,
      verified: true,
      message: 'Email verified successfully.',
    };
  }

  /**
   * Check if an email has completed OTP verification
   */
  static isVerified(email) {
    if (!email) return false;
    const normalizedEmail = email.trim().toLowerCase();
    const record = otpStore.get(normalizedEmail);
    return Boolean(record && record.verified && record.expiresAt > Date.now());
  }

  /**
   * Clear OTP record after registration
   */
  static consumeOtp(email) {
    if (!email) return;
    otpStore.delete(email.trim().toLowerCase());
  }
}
