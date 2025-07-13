import {
  Button,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/layout';

interface TradeStatusEmailProps {
  recipientName: string;
  offerOwnerName: string;
  offerTitle: string;
  status: 'accepted' | 'declined';
  conversationLink?: string;
}

export const TradeStatusEmail: React.FC<TradeStatusEmailProps> = ({
  recipientName,
  offerOwnerName,
  offerTitle,
  status,
  conversationLink,
}) => {
  const isAccepted = status === 'accepted';
  const preview = `Your trade proposal was ${status}`;
  const heading = isAccepted ? 'Trade Accepted!' : 'Trade Declined';
  
  return (
    <EmailLayout preview={preview} heading={heading}>
      <Text style={text}>Hi {recipientName},</Text>
      
      <Text style={text}>
        {isAccepted ? (
          <>
            Great news! <strong>{offerOwnerName}</strong> has accepted your trade 
            proposal for:
          </>
        ) : (
          <>
            <strong>{offerOwnerName}</strong> has declined your trade proposal for:
          </>
        )}
      </Text>
      
      <Section style={offerBox}>
        <Text style={offerTitleStyle}>{offerTitle}</Text>
      </Section>
      
      {isAccepted ? (
        <>
          <Text style={text}>
            You can now coordinate with {offerOwnerName} to arrange the exchange. 
            Use the conversation feature to discuss meeting details, timing, and location.
          </Text>
          
          {conversationLink && (
            <Section style={buttonContainer}>
              <Button style={button} href={conversationLink}>
                Continue Conversation
              </Button>
            </Section>
          )}
          
          <Text style={text}>
            Remember to:
          </Text>
          
          <ul style={list}>
            <li style={listItem}>Agree on a safe, public meeting location</li>
            <li style={listItem}>Confirm the items being exchanged</li>
            <li style={listItem}>Be respectful and communicate clearly</li>
          </ul>
        </>
      ) : (
        <>
          <Text style={text}>
            Don't worry! There are plenty of other items available on Marketplace. 
            Keep exploring and you'll find the perfect trade.
          </Text>
          
          <Section style={buttonContainer}>
            <Button style={button} href={process.env.NEXTAUTH_URL || 'https://yourmarketplace.com'}>
              Browse More Items
            </Button>
          </Section>
        </>
      )}
    </EmailLayout>
  );
};

const text = {
  color: '#000000', // black
  fontSize: '15px', // body size
  lineHeight: '24px',
  margin: '0 0 16px',
};

const offerBox = {
  backgroundColor: '#ffebb5', // tan
  borderRadius: '6px', // md
  padding: '16px',
  margin: '16px 0',
  border: '1px solid #000000',
};

const offerTitleStyle = {
  color: '#000000', // black
  fontSize: '15px', // body size
  fontWeight: '600',
  margin: '0',
};

const list = {
  margin: '16px 0',
  padding: '0 0 0 20px',
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

export default TradeStatusEmail;