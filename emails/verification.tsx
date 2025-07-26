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
            src={`${process.env.NEXTAUTH_URL}/images/brownhat_final.png`}
            width="48"
            height="48"
            alt="Brown Straw Hat"
            style={logo}
          />
          <Text style={title}>
            <strong>Welcome to Brown Straw Hat, {firstName}!</strong>
          </Text>
          <Section style={section}>
            <Text style={text}>
              Thanks for signing up! To get started trading items with fellow travelers, 
              please verify your email address by clicking the button below.
            </Text>
            <Button style={button} href={verificationUrl}>
              Verify Email Address
            </Button>
            <Text style={text}>
              Or copy and paste this link into your browser:
            </Text>
            <Link href={verificationUrl} style={link}>
              {verificationUrl}
            </Link>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            This link will expire in 24 hours. If you didn't create an account with Brown Straw Hat, 
            you can safely ignore this email.
          </Text>
          <Text style={footer}>
            Happy trading!
            <br />
            The Brown Straw Hat Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const logo = {
  margin: '0 auto',
  marginBottom: '16px',
};

const section = {
  padding: '0 48px',
};

const title = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  padding: '0',
  textAlign: 'center' as const,
  margin: '30px 0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  textAlign: 'left' as const,
};

const button = {
  backgroundColor: '#D2B48C',
  borderRadius: '4px',
  color: '#000',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px',
  marginTop: '16px',
  marginBottom: '16px',
};

const link = {
  color: '#2754C5',
  fontSize: '14px',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '20px',
  textAlign: 'left' as const,
  padding: '0 48px',
};

export default VerificationEmail;