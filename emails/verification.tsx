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

interface VerificationEmailProps {
  firstName: string;
  verificationUrl: string;
}

export function VerificationEmail({
  firstName,
  verificationUrl,
}: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your email to get started with Brown Straw Hat</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${process.env.NEXTAUTH_URL}/images/brownhat.png`}
            width="120"
            height="64"
            alt="Brown Straw Hat"
            style={logo}
          />
          <Text style={title}>
            Welcome to Brown Straw Hat, {firstName}!
          </Text>
          <Section style={section}>
            <Text style={text}>
              Thanks for signing up! To get started trading items with fellow travelers, please verify your email address by clicking the button below.
            </Text>
            <Button style={button} href={verificationUrl}>
              Verify Email
            </Button>
            <Text style={altText}>
              Or copy and paste this link into your browser:
              <br />
              <Link href={verificationUrl} style={link}>
                {verificationUrl}
              </Link>
            </Text>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            This link will expire in 24 hours. If you didn't create an account with Brown Straw Hat, you can safely ignore this email.
            <br />
            <br />
            Happy trading!
            <br />
            The Brown Straw Hat Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

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
  textAlign: 'center' as const,
};

const title = {
  color: '#000000',
  fontSize: '28px',
  fontWeight: '400',
  padding: '0',
  textAlign: 'center' as const,
  margin: '0 0 48px 0',
};

const text = {
  color: '#000000',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  margin: '0 0 48px 0',
};

const altText = {
  color: '#000000',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  margin: '0 0 8px 0',
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
  margin: '0 auto 48px auto',
  boxShadow: '3px 3px 0px #000000',
};

const link = {
  color: '#000000',
  fontSize: '16px',
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
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  padding: '0 48px',
};

export default VerificationEmail;