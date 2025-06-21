"use client"

import { signOut } from "next-auth/react"

export default function SignOutButton() {
  return (
    <button
      className="text-button text-black hover:text-gray transition-colors"
      onClick={() => signOut()}
    >
      Sign Out
    </button>
  )
}