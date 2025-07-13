'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tan px-4">
        <div className="w-full max-w-sm mx-auto text-center">
          <h2 className="text-heading-2 mb-4">Check your email</h2>
          <p className="text-body text-gray mb-6">
            If an account exists with {email}, you will receive a password reset link.
          </p>
          <Button
            onClick={handleBack}
            variant="secondary"
            fullWidth
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-tan px-4">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-heading-2 mb-2">Forgot your password?</h2>
          <p className="text-body text-gray">
            Enter your email and we'll send you a reset link
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-body text-gray mb-2">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-black rounded-lg text-body placeholder-gray focus:outline-none focus:ring-1 focus:ring-black bg-tan [&:-webkit-autofill]:!bg-tan [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#ffebb5]"
              placeholder="Enter your email"
            />
          </div>

          {error && (
            <div className="text-red-600 text-body">{error}</div>
          )}

          <Button
            type="submit"
            disabled={loading}
            fullWidth
            variant="secondary"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </Button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={handleBack}
              className="text-body text-gray hover:underline"
            >
              Back to Home
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}