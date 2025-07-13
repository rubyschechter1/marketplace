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
        You're receiving this because you have a trade conversation on Marketplace. 
        You can manage your email preferences in your account settings.
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

const messageBox = {
  backgroundColor: '#f9f9f9',
  borderLeft: '4px solid #5469d4',
  padding: '16px',
  margin: '16px 0',
};

const messagePreviewStyle = {
  color: '#333',
  fontSize: '14px',
  fontStyle: 'italic',
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

export default NewMessageEmail;