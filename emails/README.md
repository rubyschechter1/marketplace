# Email Functionality Setup

This marketplace app now includes comprehensive email functionality powered by Resend and React Email.

## Email Templates Implemented

### 1. Password Reset Email (`password-reset.tsx`)
- Sent when a user requests a password reset
- Contains a secure link that expires in 1 hour
- Link directs to `/auth/reset-password` with a token

### 2. Welcome Email (`welcome.tsx`)
- Sent automatically when a new user signs up
- Introduces the marketplace features
- Includes a CTA to start trading

### 3. Trade Proposal Email (`trade-proposal.tsx`)
- Sent when someone proposes a trade for your offer
- Shows the proposed item and offer details
- Links directly to the offer page to review/accept/decline

### 4. Trade Status Email (`trade-status.tsx`)
- Sent when your trade proposal is accepted or declined
- For accepted trades: includes link to conversation
- For declined trades: encourages browsing other items

### 5. New Message Email (`new-message.tsx`)
- Sent when you receive a new message in a trade conversation
- Shows message preview (first 150 characters)
- Links directly to the conversation

## Configuration

### 1. Get a Resend API Key
1. Sign up at [resend.com](https://resend.com)
2. Create an API key from your dashboard
3. Add to your `.env` file:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   FROM_EMAIL=noreply@yourdomain.com
   ```

### 2. Verify Your Domain (Production)
- In Resend dashboard, add and verify your domain
- Update `FROM_EMAIL` to use your verified domain
- For development, you can use Resend's test mode

### 3. Set Your App URL
Ensure `NEXTAUTH_URL` is set correctly in your `.env`:
```
NEXTAUTH_URL=http://localhost:3000  # Development
NEXTAUTH_URL=https://yourdomain.com  # Production
```

## Testing Emails

### Development Testing
- Without `RESEND_API_KEY` set, password reset links are logged to console
- With Resend API key, emails are sent to real addresses
- Use Resend's test mode to avoid sending real emails during development

### Email Preview
You can preview email templates by creating a simple preview route:
```tsx
// app/email-preview/[template]/route.tsx
import { PasswordResetEmail } from '@/emails/password-reset'
import { render } from '@react-email/render'

export async function GET(request: Request, { params }: { params: { template: string } }) {
  // Render the appropriate template with test data
  const html = render(PasswordResetEmail({ firstName: 'Test', resetLink: '#' }))
  return new Response(html, { headers: { 'Content-Type': 'text/html' } })
}
```

## Future Enhancements

The last todo item (email preferences) would allow users to:
- Opt in/out of different notification types
- Set email frequency preferences
- Choose digest vs instant notifications

This would require:
1. Adding email preference fields to the user schema
2. Creating a preferences UI in the profile settings
3. Checking preferences before sending each email type