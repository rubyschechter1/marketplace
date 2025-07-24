'use client'

import AuthLayout from '@/components/AuthLayout'

export default function PrivacyPage() {
  return (
    <AuthLayout>
      <div className="p-4 pb-20">
        <h1 className="text-header font-bold mb-6 text-center">Privacy Policy</h1>
        
        <div className="space-y-6 text-sm leading-relaxed">
          <div>
            <p className="text-xs text-gray mb-4">Last updated: {new Date().toLocaleDateString()}</p>
            <p className="mb-4">
              Brown Straw Hat ("we," "our," or "us") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data.
            </p>
          </div>

          <section>
            <h2 className="font-bold text-body mb-3">1. Information We Collect</h2>
            <div className="space-y-2 mb-3">
              <p><strong>Account Information:</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Name (first name and last initial)</li>
                <li>Email address</li>
                <li>Password (encrypted)</li>
                <li>Profile information (bio, avatar, languages, countries visited)</li>
              </ul>
              
              <p><strong>Usage Information:</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Location data (when you create offers or search)</li>
                <li>Messages and conversations</li>
                <li>Items you create, offer, or receive</li>
                <li>Reviews and ratings</li>
              </ul>
              
              <p><strong>Technical Information:</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Usage analytics and performance data</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="font-bold text-body mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li>Provide and improve our barter marketplace service</li>
              <li>Connect you with other travelers for exchanges</li>
              <li>Send notifications about messages and trade updates</li>
              <li>Ensure platform safety and prevent fraud</li>
              <li>Analyze usage patterns to improve user experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-body mb-3">3. Information Sharing</h2>
            <p className="mb-3">We do not sell your personal information. We may share information in these circumstances:</p>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li><strong>With Other Users:</strong> Your public profile information (name, avatar, bio) is visible to facilitate exchanges</li>
              <li><strong>Service Providers:</strong> Third-party services that help us operate the platform (email, hosting, analytics)</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or to protect safety</li>
              <li><strong>Business Transfer:</strong> In the event of a merger, sale, or transfer of assets</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-body mb-3">4. Location Data</h2>
            <p className="mb-3">
              We use your location to show you nearby offers and display your general location to other users. 
              We only share approximate location (city/region) with other users, never your exact coordinates. 
              You can control location sharing in your device settings.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-body mb-3">5. Data Security</h2>
            <p className="mb-3">
              We implement appropriate security measures to protect your information, including:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li>Encrypted password storage</li>
              <li>Secure data transmission (HTTPS)</li>
              <li>Regular security updates and monitoring</li>
              <li>Limited access to personal data by our team</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-body mb-3">6. Data Retention</h2>
            <p className="mb-3">
              We retain your information as long as your account is active or as needed to provide services. 
              You may request account deletion at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-body mb-3">7. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li>Access your personal information</li>
              <li>Update or correct your data</li>
              <li>Delete your account and data</li>
              <li>Export your data</li>
              <li>Object to certain processing activities</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-body mb-3">8. Cookies and Tracking</h2>
            <p className="mb-3">
              We use essential cookies for authentication and site functionality. We may use analytics 
              cookies to improve our service. You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-body mb-3">9. Children's Privacy</h2>
            <p className="mb-3">
              Our service is not intended for users under 18. We do not knowingly collect information 
              from children under 18. If you believe a child has provided us with personal information, 
              please contact us.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-body mb-3">10. International Users</h2>
            <p className="mb-3">
              Our service is hosted in the United States. By using our service, you consent to the 
              transfer and processing of your information in the United States.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-body mb-3">11. Changes to This Policy</h2>
            <p className="mb-3">
              We may update this Privacy Policy from time to time. We will notify users of significant 
              changes via email or platform notification.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-body mb-3">12. Contact Us</h2>
            <p className="mb-3">
              If you have questions about this Privacy Policy or your data, contact us at: 
              privacy@brownstrawhat.com
            </p>
          </section>

          <div className="bg-tan border border-black rounded-md p-4 mt-6">
            <p className="font-bold mb-2">📧 Data Requests</p>
            <p className="text-sm">
              To request access to your data, request deletion, or ask questions about how we handle 
              your information, please email us at privacy@brownstrawhat.com with your request.
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}