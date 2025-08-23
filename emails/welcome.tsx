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

interface WelcomeEmailProps {
  firstName: string;
  lastName?: string | null;
  email: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  firstName,
  lastName,
  email,
}) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Brown Straw Hat!</Preview>
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
              Welcome to Brown Straw Hat!
            </Text>
            <Text style={text}>
              Hi {firstName},
            </Text>
            <Text style={text}>
              Welcome to Brown Straw Hat! We're excited to have you join our community of travelers sharing and trading items around the world.
            </Text>
            <Text style={{margin: '0 0 5px 0'}}>&nbsp;</Text>
            <Text style={text}>
              Here's what you can do on Brown Straw Hat:
            </Text>
            
            <Section style={bulletList}>
              <div style={bulletItem}>
                <Text style={bulletPoint}>•</Text>
                <Img
                  src={`${process.env.NEXTAUTH_URL}/images/backpack.png`}
                  width="20"
                  height="20"
                  alt=""
                  style={bulletIcon}
                />
                <Text style={bulletText}>List items you want to trade or give away</Text>
              </div>
              <div style={bulletItem}>
                <Text style={bulletPoint}>•</Text>
                <Img
                  src={`${process.env.NEXTAUTH_URL}/images/newsearch.png`}
                  width="20"
                  height="20"
                  alt=""
                  style={bulletIcon}
                />
                <Text style={bulletText}>Discover items from travelers near you</Text>
              </div>
              <div style={bulletItem}>
                <Text style={bulletPoint}>•</Text>
                <Img
                  src={`${process.env.NEXTAUTH_URL}/images/new_mail.png`}
                  width="22"
                  height="14"
                  alt=""
                  style={bulletIcon}
                />
                <Text style={bulletText}>Message other travelers to arrange trades</Text>
              </div>
              <div style={bulletItem}>
                <Text style={bulletPoint}>•</Text>
                <Img
                  src={`${process.env.NEXTAUTH_URL}/images/new_home.png`}
                  width="20"
                  height="20"
                  alt=""
                  style={bulletIcon}
                />
                <Text style={bulletText}>Build a sustainable travel community</Text>
              </div>
            </Section>
            <Text style={{margin: '0 0 5px 0'}}>&nbsp;</Text>
            
            <Button style={button} href={`${process.env.NEXTAUTH_URL}/profile`}>
              Start Trading
            </Button>
            
            <Text style={text}>
              Your account email: {email}
              <br />
              Happy trading!
            </Text>
            
            <Text style={text}>
              The Brown Straw Hat Team
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

const bulletList = {
  margin: '0 0 5px 0',
};

const bulletItem = {
  display: 'flex',
  alignItems: 'flex-start',
  marginBottom: '2px',
};

const bulletPoint = {
  color: '#000000',
  fontSize: '16px',
  lineHeight: '24px',
  marginRight: '8px',
  margin: '0 8px 0 0',
};

const bulletIcon = {
  marginRight: '12px',
  flexShrink: 0,
  marginTop: '2px',
};

const bulletText = {
  color: '#000000',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
  display: 'inline',
  marginBottom: '0',
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

export default WelcomeEmail;