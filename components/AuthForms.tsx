"use client"

import { useState } from "react"
import LoginForm from "./LoginForm"
import SignupForm from "./SignupForm"

export default function AuthForms() {
  const [mode, setMode] = useState<'buttons' | 'login' | 'signup'>('buttons')

  if (mode === 'buttons') {
    return (
      <div className="w-full max-w-sm mx-auto space-y-4">
        <button
          onClick={() => setMode('login')}
          className="w-full py-3 px-6 text-button rounded-sm transition-all font-normal bg-tan text-black border border-black shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px]"
        >
          Log In
        </button>
        <button
          onClick={() => setMode('signup')}
          className="w-full py-3 px-6 text-button rounded-sm transition-all font-normal bg-tan text-black border border-black shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px]"
        >
          Sign Up
        </button>
      </div>
    )
  }

  return (
    <div>
      {mode === 'login' ? (
        <LoginForm onSwitch={() => setMode('signup')} onBack={() => setMode('buttons')} />
      ) : (
        <SignupForm onSwitch={() => setMode('login')} onBack={() => setMode('buttons')} />
      )}
    </div>
  )
}