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
      <main className="p-6 max-w-md mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-header font-normal">Marketplace</h1>
          <Link 
            href="/profile"
            className="w-10 h-10 bg-gray/20 rounded-full flex items-center justify-center text-sm hover:bg-gray/30 transition-colors"
          >
            {session.user?.name?.[0] || 'U'}
          </Link>
        </div>
        
        <p className="text-body text-gray mb-8">Welcome back, {session.user?.name?.split(' ')[0]}!</p>
        
        <div className="space-y-4">
          <Link
            href="/offers"
            className="block w-full bg-black text-white p-4 rounded-sm hover:bg-gray transition-colors text-center text-button"
          >
            Browse Nearby Offers
          </Link>
          
          <Link
            href="/offers/new"
            className="block w-full bg-tan border border-black p-4 rounded-sm hover:bg-white transition-colors text-center text-button"
          >
            Create an Offer
          </Link>
        </div>

        {/* Recent Activity Section */}
        <div className="mt-12">
          <h2 className="text-body font-normal mb-4">Recent Activity</h2>
          <div className="border-t border-thin pt-4">
            <p className="text-body text-gray text-center py-8">
              No recent activity yet
            </p>
          </div>
        </div>
      </main>
    </AuthLayout>
  )
}