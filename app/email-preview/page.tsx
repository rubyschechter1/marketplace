import Link from 'next/link';

export default function EmailPreviewPage() {
  const templates = [
    { id: 'verification', name: 'Email Verification', description: 'Sent when a user signs up to verify their email' },
    { id: 'welcome', name: 'Welcome Email', description: 'Sent when a user signs up' },
    { id: 'password-reset', name: 'Password Reset', description: 'Sent when user requests password reset' },
    { id: 'trade-proposal', name: 'Trade Proposal', description: 'Sent when someone proposes a trade' },
    { id: 'trade-accepted', name: 'Trade Accepted', description: 'Sent when a trade is accepted' },
    { id: 'trade-declined', name: 'Trade Declined', description: 'Sent when a trade is declined' },
    { id: 'new-message', name: 'New Message', description: 'Sent when user receives a message' },
  ];

  return (
    <div className="min-h-screen bg-tan p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-heading-2 mb-8">Email Template Previews</h1>
        
        <div className="grid gap-4">
          {templates.map((template) => (
            <div key={template.id} className="bg-white border border-black rounded-md p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-body font-semibold">{template.name}</h2>
                  <p className="text-body text-gray">{template.description}</p>
                </div>
                <Link
                  href={`/email-preview/${template.id}`}
                  target="_blank"
                  className="px-4 py-2 bg-black text-tan rounded-md hover:bg-gray transition-colors text-button"
                >
                  Preview
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 p-4 bg-white border border-black rounded-md">
          <h2 className="text-body font-semibold mb-2">How to use:</h2>
          <ol className="list-decimal list-inside space-y-1 text-body text-gray">
            <li>Click on any "Preview" button to see the email template</li>
            <li>The preview will open in a new tab</li>
            <li>You can modify the sample data in <code className="bg-tan px-1 rounded">app/email-preview/[template]/route.tsx</code></li>
            <li>Changes to email templates will be reflected immediately</li>
          </ol>
        </div>
      </div>
    </div>
  );
}