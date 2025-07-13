import {
  Button,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/layout';

interface WelcomeEmailProps {
  firstName: string;
  email: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  firstName,
  email,
}) => {
  const preview = 'Welcome to Marketplace!';
  
  return (
    <EmailLayout preview={preview} heading="Welcome to Marketplace!">
      <Text style={text}>Hi {firstName},</Text>
      
      <Text style={text}>
        Welcome to Marketplace! We're excited to have you join our community of travelers 
        sharing and trading items around the world.
      </Text>
      
      <Text style={text}>
        Here's what you can do on Marketplace:
      </Text>
      
      <ul style={list}>
        <li style={listItem}>🎒 List items you want to trade or give away</li>
        <li style={listItem}>📍 Discover items from travelers near you</li>
        <li style={listItem}>💬 Message other travelers to arrange trades</li>
        <li style={listItem}>🌍 Build a sustainable travel community</li>
      </ul>
      
      <Section style={buttonContainer}>
        <Button style={button} href={process.env.NEXTAUTH_URL || 'https://yourmarketplace.com'}>
          Start Trading
        </Button>
      </Section>
      
      <Text style={text}>
        Your account email: {email}
      </Text>
      
      <Text style={text}>
        Happy trading!
        <br />
        The Marketplace Team
      </Text>
    </EmailLayout>
  );
};

const text = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const list = {
  margin: '16px 0',
  padding: '0',
};

const listItem = {
  margin: '8px 0',
  fontSize: '14px',
  lineHeight: '20px',
  color: '#333',
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

export default WelcomeEmail;