import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { formatNameWithLastInitial } from '@/lib/utils/name-formatter';

interface PasswordResetEmailProps {
  firstName: string;
  lastName?: string | null;
  resetLink: string;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({
  firstName,
  lastName,
  resetLink,
}) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your Brown Straw Hat password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${process.env.NEXTAUTH_URL}/images/brownhat.png`}
            width="120"
            height="64"
            alt="Brown Straw Hat"
            style={logo}
          />
          <Section style={section}>
            <Text style={title}>
              Reset your password
            </Text>
            <Text style={text}>
              Hi {firstName},
            </Text>
            <Text style={text}>
              We received a request to reset your password. Click the button below to create a new password:
            </Text>
            
            <Button style={button} href={resetLink}>
              Reset Password
            </Button>
            
            <Text style={text}>
              This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </Text>
            
            <Text style={text}>
              If the button doesn't work, you can copy and paste this link into your browser:
              <br />
              <Link href={resetLink} style={link}>
                {resetLink}
              </Link>
            </Text>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            This email was sent by Brown Straw Hat. If you have any questions, <Link href="mailto:support@brownstrawhat.com" style={link}>contact support</Link>.
            <br />
            © {new Date().getFullYear()} Brown Straw Hat. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Email clients block external fonts, so we use system serif fonts that look similar to Instrument Serif
const main = {
  backgroundColor: '#ffebb5',
  fontFamily:
    'Palatino, Palatino Linotype, Palatino LT STD, Book Antiqua, Georgia, serif',
};

const container = {
  backgroundColor: '#ffebb5',
  margin: '0 auto',
  padding: '48px 20px',
  maxWidth: '600px',
};

const logo = {
  margin: '0 auto',
  marginBottom: '32px',
  display: 'block',
};

const section = {
  padding: '0 48px',
};

const title = {
  color: '#000000',
  fontSize: '28px',
  fontWeight: '400',
  padding: '0',
  textAlign: 'left' as const,
  margin: '0 0 48px 0',
};

const text = {
  color: '#000000',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  margin: '0 0 5px 0',
};

const button = {
  backgroundColor: '#ffebb5',
  border: '2px solid #000000',
  borderRadius: '3px',
  color: '#000',
  fontSize: '18px',
  fontWeight: '400',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  maxWidth: '400px',
  padding: '16px 32px',
  margin: '20px auto 20px 0',
  boxShadow: '3px 3px 0px #000000',
};

const link = {
  color: '#000000',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
};

const hr = {
  borderColor: '#000000',
  borderTop: '1px solid #000000',
  margin: '48px 0 32px 0',
};

const footer = {
  color: '#5e5e5e',
  fontSize: '14px',
  lineHeight: '20px',
  textAlign: 'left' as const,
  padding: '0 48px',
};

export default PasswordResetEmail;