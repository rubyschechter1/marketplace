import {
  Button,
  Section,
  Text,
  Link,
} from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/layout';

interface TradeProposalEmailProps {
  recipientName: string;
  proposerName: string;
  offerTitle: string;
  offeredItemName: string;
  proposalLink: string;
}

export const TradeProposalEmail: React.FC<TradeProposalEmailProps> = ({
  recipientName,
  proposerName,
  offerTitle,
  offeredItemName,
  proposalLink,
}) => {
  const preview = `${proposerName} wants to trade with you`;
  
  return (
    <EmailLayout preview={preview} heading="New Trade Proposal!">
      <Text style={text}>Hi {recipientName},</Text>
      
      <Text style={text}>
        Good news! <strong>{proposerName}</strong> is interested in your offer:
      </Text>
      
      <Section style={offerBox}>
        <Text style={offerTitleStyle}>Your offer: {offerTitle}</Text>
      </Section>
      
      <Text style={text}>
        They're proposing to trade with:
      </Text>
      
      <Section style={offerBox}>
        <Text style={offerTitleStyle}>{offeredItemName}</Text>
      </Section>
      
      <Section style={buttonContainer}>
        <Button style={button} href={proposalLink}>
          View Trade Proposal
        </Button>
      </Section>
      
      <Text style={text}>
        You can accept or decline this trade proposal, or start a conversation 
        with {proposerName} to discuss the details.
      </Text>
      
      <Text style={smallText}>
        If you're not interested, you can simply ignore this email or decline 
        the proposal to let {proposerName} know.
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

const smallText = {
  color: '#666',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '0 0 16px',
};

const offerBox = {
  backgroundColor: '#f6f9fc',
  borderRadius: '4px',
  padding: '16px',
  margin: '16px 0',
};

const offerTitleStyle = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
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

export default TradeProposalEmail;