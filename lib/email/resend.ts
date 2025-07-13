import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set. Email functionality will not work.');
}

// Use a dummy key if not set to prevent build errors
export const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build');

export const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@yourmarketplace.com';