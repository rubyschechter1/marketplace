import { NextRequest, NextResponse } from 'next/server';
import { render } from '@react-email/render';
import * as React from 'react';

// Import all email templates
import { PasswordResetEmail } from '@/emails/password-reset';
import { WelcomeEmail } from '@/emails/welcome';
import { VerificationEmail } from '@/emails/verification';
import { TradeProposalEmail } from '@/emails/trade-proposal';
import { TradeStatusEmail } from '@/emails/trade-status';
import { NewMessageEmail } from '@/emails/new-message';

// Sample data for each template
const sampleData = {
  'verification': {
    firstName: 'Emma',
    verificationUrl: 'https://brownstrawhat.com/api/auth/verify-email?token=sample-verification-token',
  },
  'password-reset': {
    firstName: 'John',
    resetLink: 'https://brownstrawhat.com/auth/reset-password?token=sample-token',
  },
  'welcome': {
    firstName: 'Sarah',
    email: 'sarah@example.com',
  },
  'trade-proposal': {
    recipientName: 'Mike',
    proposerName: 'Emma',
    offerTitle: 'Vintage Camera',
    offeredItemName: 'Hiking Backpack',
    proposalLink: 'https://brownstrawhat.com/offers/123',
  },
  'trade-accepted': {
    recipientName: 'Alex',
    offerOwnerName: 'Jordan',
    offerTitle: 'Swiss Army Knife',
    status: 'accepted' as const,
    conversationLink: 'https://brownstrawhat.com/messages/123/456',
  },
  'trade-declined': {
    recipientName: 'Chris',
    offerOwnerName: 'Pat',
    offerTitle: 'Travel Guide Books',
    status: 'declined' as const,
  },
  'new-message': {
    recipientName: 'Lisa',
    senderName: 'Tom',
    messagePreview: 'Hey, I\'m really interested in your camera! I have a vintage lens collection that might interest you...',
    offerTitle: 'Canon AE-1 Camera',
    conversationLink: 'https://brownstrawhat.com/messages/789/012',
  },
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ template: string }> }
) {
  const { template } = await context.params;

  let emailComponent;
  let previewData;

  switch (template) {
    case 'verification':
      previewData = sampleData['verification'];
      emailComponent = React.createElement(VerificationEmail, previewData);
      break;
    case 'password-reset':
      previewData = sampleData['password-reset'];
      emailComponent = React.createElement(PasswordResetEmail, previewData);
      break;
    case 'welcome':
      previewData = sampleData['welcome'];
      emailComponent = React.createElement(WelcomeEmail, previewData);
      break;
    case 'trade-proposal':
      previewData = sampleData['trade-proposal'];
      emailComponent = React.createElement(TradeProposalEmail, previewData);
      break;
    case 'trade-accepted':
      previewData = sampleData['trade-accepted'];
      emailComponent = React.createElement(TradeStatusEmail, previewData);
      break;
    case 'trade-declined':
      previewData = sampleData['trade-declined'];
      emailComponent = React.createElement(TradeStatusEmail, previewData);
      break;
    case 'new-message':
      previewData = sampleData['new-message'];
      emailComponent = React.createElement(NewMessageEmail, previewData);
      break;
    default:
      return NextResponse.json(
        { 
          error: 'Template not found',
          available: [
            'verification',
            'password-reset',
            'welcome',
            'trade-proposal',
            'trade-accepted',
            'trade-declined',
            'new-message'
          ]
        },
        { status: 404 }
      );
  }

  try {
    const html = await render(emailComponent);
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error rendering email template:', error);
    return NextResponse.json(
      { error: 'Failed to render email template' },
      { status: 500 }
    );
  }
}