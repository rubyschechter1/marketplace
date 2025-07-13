import {
  Button,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/layout';

interface NewMessageEmailProps {
  recipientName: string;
  senderName: string;
  messagePreview: string;
  offerTitle: string;
  conversationLink: string;
}

export const NewMessageEmail: React.FC<NewMessageEmailProps> = ({
  recipientName,
  senderName,
  messagePreview,
  offerTitle,
  conversationLink,
}) => {
  const preview = `New message from ${senderName}`;
  
  return (
    <EmailLayout preview={preview} heading="You have a new message">
      <Text style={text}>Hi {recipientName},</Text>
      
      <Text style={text}>
        <strong>{senderName}</strong> sent you a message about:
      </Text>
      
      <Section style={offerBox}>
        <Text style={offerTitleStyle}>{offerTitle}</Text>
      </Section>
      
      <Section style={messageBox}>
        <Text style={messagePreviewStyle}>"{messagePreview}"</Text>
      </Section>
      
      <Section style={buttonContainer}>
        <Button style={button} href={conversationLink}>
          View Conversation
        </Button>
      </Section>
      
      <Text style={smallText}>
        You're receiving this because you have a trade conversation on Brown Straw Hat. 
        You can manage your email preferences in your account settings.
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

const smallText = {
  color: '#5e5e5e', // gray
  fontSize: '12px',
  lineHeight: '20px',
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

const messageBox = {
  backgroundColor: '#ffffff',
  borderLeft: '4px solid #000000',
  padding: '16px',
  margin: '16px 0',
  border: '1px solid #000000',
};

const messagePreviewStyle = {
  color: '#000000', // black
  fontSize: '15px', // body size
  fontStyle: 'italic',
  margin: '0',
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

export default NewMessageEmail;