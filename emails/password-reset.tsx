import {
  Button,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/layout';

interface PasswordResetEmailProps {
  firstName: string;
  resetLink: string;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({
  firstName,
  resetLink,
}) => {
  const preview = 'Reset your Marketplace password';
  
  return (
    <EmailLayout preview={preview} heading="Reset your password">
      <Text style={text}>Hi {firstName},</Text>
      
      <Text style={text}>
        We received a request to reset your password. Click the button below to
        create a new password:
      </Text>
      
      <Section style={buttonContainer}>
        <Button style={button} href={resetLink}>
          Reset Password
        </Button>
      </Section>
      
      <Text style={text}>
        This link will expire in 1 hour. If you didn't request a password reset,
        you can safely ignore this email.
      </Text>
      
      <Text style={text}>
        If the button doesn't work, you can copy and paste this link into your
        browser:
      </Text>
      
      <Text style={link}>{resetLink}</Text>
    </EmailLayout>
  );
};

const text = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const buttonContainer = {
  margin: '32px 0',
};

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
  fontWeight: '600',
};

const link = {
  color: '#2754C5',
  fontSize: '12px',
  wordBreak: 'break-all' as const,
};

export default PasswordResetEmail;