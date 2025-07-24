'use client'

import AuthLayout from '@/components/AuthLayout'

export default function TermsPage() {
  return (
    <AuthLayout>
      <div className="p-4 pb-20">
        <h1 className="text-header font-bold mb-6 text-center">Terms of Service</h1>
        
        <div className="space-y-6 text-sm leading-relaxed">
          <div>
            <p className="text-xs text-gray mb-4">Last updated: {new Date().toLocaleDateString()}</p>
            <p className="mb-4">
              Welcome to Brown Straw Hat ("we," "our," or "us"). By creating an account and using our platform, 
              you agree to be bound by these Terms of Service ("Terms").
            </p>
          </div>

          <section>
            <h2 className="font-bold text-body mb-3">1. Platform Purpose</h2>
            <p className="mb-3">
              Brown Straw Hat is a barter marketplace that connects travelers who wish to exchange items 
              without monetary transactions. Our platform facilitates connections only - we do not participate 
              in, oversee, or guarantee any exchanges.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-body mb-3">2. In-Person Meeting Disclaimer</h2>
            <div className="bg-tan border border-black rounded-md p-4 mb-3">
              <p className="font-bold mb-2">⚠️ IMPORTANT SAFETY NOTICE</p>
              <p className="mb-2">
                You acknowledge that using our platform may involve meeting strangers in person. 
                <strong> We strongly recommend meeting only in public, well-lit locations during daylight hours.</strong>
              </p>
            </div>
            
            <p className="mb-3">
              <strong>Safety Guidelines:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li>Always meet in public places (cafes, shopping centers, police stations)</li>
              <li>Inform a trusted friend or family member of your meeting plans</li>
              <li>Consider bringing a friend to exchanges</li>
              <li>Trust your instincts - if something feels wrong, leave immediately</li>
              <li>Verify identity through our platform messaging before meeting</li>
              <li>Never share personal information like home address or financial details</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-body mb-3">3. Limitation of Liability</h2>
            <p className="mb-3">
              <strong>YOU UNDERSTAND AND AGREE THAT:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>
                <strong>We are not responsible for any harm, injury, loss, or damage</strong> that may occur 
                during in-person meetings, exchanges, or any interactions between users.
              </li>
              <li>
                <strong>We do not verify user identities</strong> or conduct background checks. You interact 
                with other users at your own risk.
              </li>
              <li>
                <strong>We do not guarantee the quality, safety, or legality</strong> of items offered for 
                barter or the accuracy of item descriptions.
              </li>
              <li>
                <strong>We are not liable for theft, fraud, or misrepresentation</strong> by users of our platform.
              </li>
              <li>
                <strong>Any disputes between users</strong> must be resolved directly between the parties involved.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-body mb-3">4. User Responsibilities</h2>
            <p className="mb-3">By using our platform, you agree to:</p>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li>Provide accurate information about yourself and items</li>
              <li>Comply with all local, state, and federal laws</li>
              <li>Not offer illegal items or engage in illegal activities</li>
              <li>Treat other users with respect and courtesy</li>
              <li>Report suspicious or inappropriate behavior</li>
              <li>Not use the platform for commercial purposes or monetary sales</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-body mb-3">5. Prohibited Items</h2>
            <p className="mb-3">The following items are strictly prohibited:</p>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li>Weapons, firearms, or dangerous items</li>
              <li>Illegal drugs or controlled substances</li>
              <li>Stolen property</li>
              <li>Hazardous materials</li>
              <li>Live animals</li>
              <li>Items that violate intellectual property rights</li>
              <li>Adult content or services</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-body mb-3">6. Account Termination</h2>
            <p className="mb-3">
              We reserve the right to suspend or terminate accounts that violate these terms, 
              engage in harmful behavior, or pose a risk to other users.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-body mb-3">7. Privacy and Data</h2>
            <p className="mb-3">
              Your privacy is important to us. By using our platform, you consent to our collection 
              and use of your information as described in our{' '}
              <a href="/privacy" className="text-black underline hover:text-gray">Privacy Policy</a>. 
              We may share information with law enforcement if required by law.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-body mb-3">8. Indemnification</h2>
            <p className="mb-3">
              You agree to indemnify and hold harmless Brown Straw Hat, its officers, directors, 
              employees, and agents from any claims, damages, losses, or expenses arising from 
              your use of the platform or violation of these terms.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-body mb-3">9. Dispute Resolution</h2>
            <p className="mb-3">
              Any disputes arising from these terms will be resolved through binding arbitration 
              in accordance with the laws of [Your Jurisdiction]. You waive your right to participate 
              in class action lawsuits.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-body mb-3">10. Changes to Terms</h2>
            <p className="mb-3">
              We may update these terms at any time. Continued use of the platform after changes 
              constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-body mb-3">11. Contact Information</h2>
            <p className="mb-3">
              If you have questions about these terms, please contact us at: legal@brownstrawhat.com
            </p>
          </section>

          <div className="bg-tan border border-black rounded-md p-4 mt-6">
            <p className="font-bold mb-2">📋 ACKNOWLEDGMENT</p>
            <p className="text-sm">
              By clicking "I Agree" during account creation, you acknowledge that you have read, 
              understood, and agree to be bound by these Terms of Service. You also acknowledge 
              the risks associated with meeting strangers and trading items in person.
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}