"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Button from "./ui/Button"

export default function SignupForm({ onSwitch, onBack }: { onSwitch: () => void; onBack: () => void }) {
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastInitial: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showTermsContent, setShowTermsContent] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check terms first before setting loading state
    if (!formData.acceptedTerms) {
      setShowTermsModal(true)
      return
    }
    
    setIsLoading(true)
    setError("")
    setSuccess("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match")
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastInitial + ".",
          password: formData.password,
          acceptedTerms: formData.acceptedTerms
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      // Show success message about email verification
      setSuccess(data.message || "Please check your email to verify your account before logging in.")
      // Clear form
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastInitial: "",
        acceptedTerms: false
      })
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-body text-gray mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-3 py-2 border border-black rounded-sm text-body placeholder-gray focus:outline-none focus:ring-1 focus:ring-black bg-tan [&:-webkit-autofill]:!bg-tan [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:hover]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:focus]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:active]:shadow-[inset_0_0_0px_1000px_#ffebb5]"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-body text-gray mb-2">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              className="w-full px-3 py-2 border border-black rounded-sm text-body placeholder-gray focus:outline-none focus:ring-1 focus:ring-black bg-tan [&:-webkit-autofill]:!bg-tan [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:hover]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:focus]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:active]:shadow-[inset_0_0_0px_1000px_#ffebb5]"
              required
            />
          </div>

          <div>
            <label htmlFor="lastInitial" className="block text-body text-gray mb-2">
              Last Initial
            </label>
            <input
              id="lastInitial"
              type="text"
              value={formData.lastInitial}
              onChange={(e) => {
                const value = e.target.value.toUpperCase()
                if (value.length <= 1 && /^[A-Z]?$/.test(value)) {
                  setFormData({...formData, lastInitial: value})
                }
              }}
              className="w-full px-3 py-2 border border-black rounded-sm text-body placeholder-gray focus:outline-none focus:ring-1 focus:ring-black bg-tan [&:-webkit-autofill]:!bg-tan [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:hover]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:focus]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:active]:shadow-[inset_0_0_0px_1000px_#ffebb5]"
              required
              maxLength={1}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-body text-gray mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full px-3 py-2 border border-black rounded-sm text-body placeholder-gray focus:outline-none focus:ring-1 focus:ring-black bg-tan [&:-webkit-autofill]:!bg-tan [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:hover]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:focus]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:active]:shadow-[inset_0_0_0px_1000px_#ffebb5]"
            required
            minLength={6}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-body text-gray mb-2">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            className="w-full px-3 py-2 border border-black rounded-sm text-body placeholder-gray focus:outline-none focus:ring-1 focus:ring-black bg-tan [&:-webkit-autofill]:!bg-tan [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:hover]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:focus]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:active]:shadow-[inset_0_0_0px_1000px_#ffebb5]"
            required
            minLength={6}
          />
        </div>

        {/* Terms of Service Acceptance */}
        <div className="flex items-start space-x-3">
          <div className="relative mt-1">
            <input
              id="acceptedTerms"
              type="checkbox"
              checked={formData.acceptedTerms}
              onChange={(e) => setFormData({...formData, acceptedTerms: e.target.checked})}
              className="sr-only"
            />
            <label
              htmlFor="acceptedTerms"
              className={`w-4 h-4 border border-black rounded-sm cursor-pointer flex items-center justify-center transition-colors ${
                formData.acceptedTerms ? 'bg-tan' : 'bg-tan'
              }`}
            >
              {formData.acceptedTerms && (
                <svg
                  className="w-3 h-3 text-black"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </label>
          </div>
          <label htmlFor="acceptedTerms" className="text-sm text-gray leading-relaxed cursor-pointer">
            I acknowledge that I have read and agree to the{' '}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                setShowTermsContent(true)
              }}
              className="text-black underline hover:text-gray"
            >
              Terms of Service
            </button>
            , including the safety disclaimers for in-person meetings and the limitation of liability.
          </label>
        </div>

        {error && (
          <div className="text-red-600 text-body">{error}</div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded-sm text-body">
            {success}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          fullWidth
          variant="secondary"
        >
          {isLoading ? "Creating account..." : "Sign Up"}
        </Button>

      </form>
      
      <button
        onClick={onBack}
        className="mt-4 text-black hover:text-gray transition-colors text-body text-left"
      >
        Back
      </button>

      {/* Terms of Service Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-tan border border-black rounded-sm max-w-sm w-full p-6">
            <h3 className="text-lg font-medium text-black mb-2">Terms of Service Required</h3>
            <p className="text-sm text-gray mb-6">
              You must accept the Terms of Service to create an account.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-4 py-2 text-sm font-medium text-black bg-tan border border-black rounded-sm hover:bg-brown/10 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Content Modal */}
      {showTermsContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-tan border border-black rounded-sm max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-black flex justify-between items-center">
              <h2 className="text-xl font-bold">Terms of Service</h2>
              <button
                onClick={() => setShowTermsContent(false)}
                className="text-2xl leading-none hover:text-gray"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6 text-sm leading-relaxed">
                <div>
                  <p className="text-xs text-gray mb-4">Last updated: {new Date().toLocaleDateString()}</p>
                  <p className="mb-4">
                    Welcome to Brown Straw Hat ("we," "our," or "us"). By creating an account and using our platform, 
                    you agree to be bound by these Terms of Service ("Terms").
                  </p>
                </div>

                <section>
                  <h3 className="font-bold text-body mb-3">1. Platform Purpose</h3>
                  <p className="mb-3">
                    Brown Straw Hat is a barter marketplace that connects travelers who wish to exchange items 
                    without monetary transactions. Our platform facilitates connections only - we do not participate 
                    in, oversee, or guarantee any exchanges.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-body mb-3">2. In-Person Meeting Disclaimer</h3>
                  <div className="bg-white border border-black rounded-md p-4 mb-3">
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
                  <h3 className="font-bold text-body mb-3">3. Limitation of Liability</h3>
                  <p className="mb-3">
                    <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-1 mb-3">
                    <li>We are not responsible for any harm, injury, theft, or damages resulting from platform use</li>
                    <li>We do not verify user identities beyond email verification</li>
                    <li>We are not liable for the quality, safety, or legality of traded items</li>
                    <li>We cannot guarantee the behavior or intentions of other users</li>
                    <li>You use this platform entirely at your own risk</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-body mb-3">4. User Responsibilities</h3>
                  <p className="mb-3">By using our platform, you agree to:</p>
                  <ul className="list-disc pl-6 space-y-1 mb-3">
                    <li>Provide accurate information in your profile</li>
                    <li>Not trade illegal, dangerous, or prohibited items</li>
                    <li>Treat other users with respect</li>
                    <li>Take full responsibility for your safety during meetings</li>
                    <li>Report suspicious or inappropriate behavior</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-body mb-3">5. Privacy & Data</h3>
                  <p className="mb-3">
                    We collect minimal personal information necessary for platform operation. 
                    Your location data is used only to show nearby offers and is not stored permanently. 
                    See our <button onClick={() => {/* TODO: Add privacy policy modal */}} className="underline">Privacy Policy</button> for details.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-body mb-3">6. Prohibited Items</h3>
                  <p className="mb-3">The following items cannot be traded:</p>
                  <ul className="list-disc pl-6 space-y-1 mb-3">
                    <li>Weapons or ammunition</li>
                    <li>Drugs or controlled substances</li>
                    <li>Stolen goods</li>
                    <li>Counterfeit items</li>
                    <li>Live animals</li>
                    <li>Human remains or body parts</li>
                    <li>Hazardous materials</li>
                    <li>Any item illegal in your jurisdiction</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-body mb-3">7. Account Termination</h3>
                  <p className="mb-3">
                    We reserve the right to suspend or terminate accounts that violate these terms, 
                    engage in fraudulent behavior, or pose a risk to other users.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-body mb-3">8. Changes to Terms</h3>
                  <p className="mb-3">
                    We may update these terms at any time. Continued use of the platform after changes 
                    constitutes acceptance of the new terms.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-body mb-3">9. Contact</h3>
                  <p>
                    For questions about these terms, please contact us through the platform's support feature.
                  </p>
                </section>
              </div>
            </div>
            
            <div className="p-4 border-t border-black">
              <button
                onClick={() => {
                  setFormData({...formData, acceptedTerms: true})
                  setShowTermsContent(false)
                }}
                className="w-full px-4 py-2 bg-black text-tan border border-black rounded-sm hover:bg-gray transition-colors font-medium"
              >
                Accept Terms of Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}