import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import AuthForms from "@/components/AuthForms"
import SignOutButton from "@/components/SignOutButton"
import AuthLayout from "@/components/AuthLayout"
import Link from "next/link"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return (
      <main className="min-h-screen p-4 max-w-md mx-auto flex flex-col justify-center">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Marketplace</h1>
          <p className="text-gray-600">Barter with fellow travelers</p>
        </div>
        
        <AuthForms />
      </main>
    )
  }

  return (
    <AuthLayout>
      <main className="p-4 max-w-md mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Marketplace</h1>
          <SignOutButton />
        </div>
        
        <p className="text-gray-600 mb-8">Welcome, {session.user?.email}!</p>
        
        <div className="space-y-4">
          <Link
            href="/offers"
            className="block w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors text-center"
          >
            Browse Nearby Offers
          </Link>
          
          <Link
            href="/offers/new"
            className="block w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition-colors text-center"
          >
            Create an Offer
          </Link>
        </div>
      </main>
    </AuthLayout>
  )
}