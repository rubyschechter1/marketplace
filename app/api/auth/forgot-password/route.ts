import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { resend, FROM_EMAIL } from '@/lib/email/resend';
import { PasswordResetEmail } from '@/emails/password-reset';
import { render } from '@react-email/render';
import crypto from 'crypto';
import * as React from 'react';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.travelers.findUnique({
      where: { email },
    });

    // Don't reveal if user exists or not for security
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with this email, you will receive a password reset link.',
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Delete any existing tokens for this user
    await prisma.passwordResetTokens.deleteMany({
      where: { userId: user.id },
    });

    // Create new token with 1 hour expiry
    await prisma.passwordResetTokens.create({
      data: {
        token: hashedToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
      },
    });

    // Construct reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;

    // Send email
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'Reset your Marketplace password',
        html: await render(
          React.createElement(PasswordResetEmail, {
            firstName: user.firstName,
            resetLink: resetUrl,
          })
        ),
      });
    } else {
      console.log('Password reset link:', resetUrl);
    }

    return NextResponse.json({
      message: 'If an account exists with this email, you will receive a password reset link.',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}