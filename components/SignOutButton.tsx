"use client"

import { signOut } from "next-auth/react"

export default function SignOutButton() {
  return (
    <button
      className="text-sm text-gray-600 hover:text-gray-800"
      onClick={() => signOut()}
    >
      Sign Out
    </button>
  )
}