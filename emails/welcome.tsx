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
  const preview = 'Welcome to Brown Straw Hat!';
  
  return (
    <EmailLayout preview={preview} heading="Welcome to Brown Straw Hat!">
      <Text style={text}>Hi {firstName},</Text>
      
      <Text style={text}>
        Welcome to Brown Straw Hat! We're excited to have you join our community of travelers 
        sharing and trading items around the world.
      </Text>
      
      <Text style={text}>
        Here's what you can do on Brown Straw Hat:
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
        The Brown Straw Hat Team
      </Text>
    </EmailLayout>
  );
};

const text = {
  color: '#000000', // black
  fontSize: '15px', // body size
  lineHeight: '24px',
  margin: '0 0 16px',
};

const list = {
  margin: '16px 0',
  padding: '0',
};

const listItem = {
  margin: '8px 0',
  fontSize: '15px', // body size
  lineHeight: '20px',
  color: '#000000', // black
};

const buttonContainer = {
  margin: '32px 0',
};

const button = {
  backgroundColor: '#000000', // black
  borderRadius: '6px', // md
  color: '#ffebb5', // tan
  fontSize: '15px', // button size
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
  fontWeight: '600',
  border: '1px solid #000000',
};

export default WelcomeEmail;