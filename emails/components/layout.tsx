import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface EmailLayoutProps {
  preview: string;
  heading: string;
  children: React.ReactNode;
}

export const EmailLayout: React.FC<EmailLayoutProps> = ({
  preview,
  heading,
  children,
}) => {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>Marketplace</Text>
          </Section>
          
          <Section style={content}>
            <Text style={headingStyle}>{heading}</Text>
            {children}
          </Section>
          
          <Section style={footer}>
            <Text style={footerText}>
              This email was sent by Marketplace. If you have any questions,{' '}
              <Link href="mailto:support@yourmarketplace.com" style={link}>
                contact support
              </Link>
              .
            </Text>
            <Text style={footerText}>
              © {new Date().getFullYear()} Marketplace. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

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

const header = {
  padding: '32px 32px 24px',
  borderBottom: '1px solid #e6e6e6',
};

const logo = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#1a1a1a',
  margin: '0',
};

const content = {
  padding: '32px',
};

const headingStyle = {
  fontSize: '24px',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  fontWeight: '400',
  color: '#484848',
  margin: '0 0 24px',
};

const footer = {
  padding: '32px',
  borderTop: '1px solid #e6e6e6',
};

const footerText = {
  color: '#666666',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '0 0 8px',
};

const link = {
  color: '#2754C5',
  textDecoration: 'underline',
};

export default EmailLayout;