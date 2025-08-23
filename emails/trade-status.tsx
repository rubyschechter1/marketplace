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

interface TradeStatusEmailProps {
  recipientName: string;
  recipientLastName?: string | null;
  offerOwnerName: string;
  offerOwnerLastName?: string | null;
  offerTitle: string;
  status: 'accepted' | 'declined';
  conversationLink?: string;
}

export const TradeStatusEmail: React.FC<TradeStatusEmailProps> = ({
  recipientName,
  recipientLastName,
  offerOwnerName,
  offerOwnerLastName,
  offerTitle,
  status,
  conversationLink,
}) => {
  const isAccepted = status === 'accepted';
  const preview = `Your trade proposal was ${status}`;
  const heading = isAccepted ? 'Trade Accepted!' : 'Trade Declined';
  
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
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
              {heading}
            </Text>
            <Text style={text}>
              Hi {recipientName},
            </Text>
            <Text style={text}>
              {isAccepted ? (
                <>
                  Great news! <strong>{formatNameWithLastInitial(offerOwnerName, offerOwnerLastName)}</strong> has accepted your trade proposal for:
                </>
              ) : (
                <>
                  <strong>{formatNameWithLastInitial(offerOwnerName, offerOwnerLastName)}</strong> has declined your trade proposal for:
                </>
              )}
            </Text>
            
            <Section style={offerBox}>
              <Text style={offerTitleStyle}>{offerTitle}</Text>
            </Section>
            
            {isAccepted ? (
              <>
                <Text style={text}>
                  You can now coordinate with {formatNameWithLastInitial(offerOwnerName, offerOwnerLastName)} to arrange the exchange. Use the conversation feature to discuss meeting details, timing, and location.
                </Text>
                
                {conversationLink && (
                  <Button style={button} href={conversationLink}>
                    Continue Conversation
                  </Button>
                )}
                
                <Text style={text}>
                  Remember to:
                </Text>
                
                <Section style={bulletList}>
                  <div style={bulletItem}>
                    <Text style={bulletPoint}>•</Text>
                    <Text style={bulletText}>Agree on a safe, public meeting location</Text>
                  </div>
                  <div style={bulletItem}>
                    <Text style={bulletPoint}>•</Text>
                    <Text style={bulletText}>Confirm the items being exchanged</Text>
                  </div>
                  <div style={bulletItem}>
                    <Text style={bulletPoint}>•</Text>
                    <Text style={bulletText}>Be respectful and communicate clearly</Text>
                  </div>
                </Section>
              </>
            ) : (
              <>
                <Text style={text}>
                  Don't worry! There are plenty of other items available on Brown Straw Hat. Keep exploring and you'll find the perfect trade.
                </Text>
                
                <Button style={button} href={process.env.NEXTAUTH_URL || 'https://brownstrawhat.com'}>
                  Browse More Items
                </Button>
              </>
            )}
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

const offerBox = {
  backgroundColor: '#ffebb5',
  borderRadius: '3px',
  padding: '16px',
  margin: '16px 0',
  border: '2px solid #000000',
};

const offerTitleStyle = {
  color: '#000000',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
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

export default TradeStatusEmail;