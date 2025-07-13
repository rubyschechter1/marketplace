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
            <Text style={logo}>Brown Straw Hat</Text>
          </Section>
          
          <Section style={content}>
            <Text style={headingStyle}>{heading}</Text>
            {children}
          </Section>
          
          <Section style={footer}>
            <Text style={footerText}>
              This email was sent by Brown Straw Hat. If you have any questions,{' '}
              <Link href="mailto:support@brownstrawhat.com" style={link}>
                contact support
              </Link>
              .
            </Text>
            <Text style={footerText}>
              © {new Date().getFullYear()} Brown Straw Hat. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#ffebb5', // tan
  fontFamily:
    'Instrument Serif, Georgia, serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  border: '1px solid #000000',
};

const header = {
  padding: '32px 32px 24px',
  borderBottom: '1px solid #000000',
  backgroundColor: '#ffebb5', // tan
};

const logo = {
  fontSize: '25px', // header size
  fontWeight: '700',
  color: '#000000', // black
  margin: '0',
  fontFamily: 'Instrument Serif, Georgia, serif',
};

const content = {
  padding: '32px',
};

const headingStyle = {
  fontSize: '25px', // header size
  lineHeight: '1.3',
  fontWeight: '600',
  color: '#000000', // black
  margin: '0 0 24px',
  fontFamily: 'Instrument Serif, Georgia, serif',
};

const footer = {
  padding: '32px',
  borderTop: '1px solid #000000',
  backgroundColor: '#ffebb5', // tan
};

const footerText = {
  color: '#5e5e5e', // gray
  fontSize: '12px',
  lineHeight: '20px',
  margin: '0 0 8px',
};

const link = {
  color: '#000000', // black
  textDecoration: 'underline',
};

export default EmailLayout;