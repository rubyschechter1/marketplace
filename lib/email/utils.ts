import { resend, FROM_EMAIL } from './resend';
import { ReactElement } from 'react';

export interface SendEmailOptions {
  to: string;
  subject: string;
  react: ReactElement;
}

/**
 * Centralized email sending function with error handling
 * In the future, this can check user preferences before sending
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  // Skip if no API key configured
  if (!process.env.RESEND_API_KEY) {
    console.log('Email not sent (no RESEND_API_KEY):', options.subject);
    return false;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      ...options,
    });
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Check if a user wants to receive a specific type of email
 * TODO: Implement when email preferences are added to user schema
 */
export async function shouldSendEmail(
  userId: string,
  emailType: 'welcome' | 'passwordReset' | 'tradeProposal' | 'tradeStatus' | 'newMessage'
): Promise<boolean> {
  // For now, always return true
  // In the future, check user preferences from database
  return true;
}