import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import AuthForms from "@/components/AuthForms"
import ProfileThumbnail from "@/components/ProfileThumbnail"
import OfferCard from "@/components/OfferCard"
import AuthLayout from "@/components/AuthLayout"
import LocationHeader from "@/components/LocationHeader"
import Link from "next/link"
import { MapPin } from "lucide-react"
import { cookies, headers } from "next/headers"

async function getUserOffers() {
  const cookieStore = await cookies()
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/offers/mine?status=active&limit=5`, {
    headers: {
      cookie: cookieStore.toString(),
    },
    cache: 'no-store'
  })
  
  if (!response.ok) {
    return []
  }
  
  const data = await response.json()
  return data.offers || []
}

async function getCurrentUser(userId: string) {
  const cookieStore = await cookies()
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/users/me`, {
    headers: {
      cookie: cookieStore.toString(),
    },
    cache: 'no-store'
  })
  
  if (!response.ok) {
    return null
  }
  
  const data = await response.json()
  return data.user
}

export default async function Home({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const session = await getServerSession(authOptions)
  const params = await searchParams

  if (!session) {
    return (
      <main className="min-h-screen p-4 max-w-md mx-auto flex flex-col justify-center">
        <div className="text-center mb-8">
          <img 
            src="/images/brownhat.png" 
            alt="Marketplace" 
            className="w-48 h-48 mx-auto mb-4 object-contain"
          />
        </div>
        
        <AuthForms />
      </main>
    )
  }

  // Get user's offers and current user data via API
  const [userOffers, currentUser] = await Promise.all([
    getUserOffers(),
    getCurrentUser(session.user.id)
  ])

  const userData = currentUser || {
    id: session.user.id,
    firstName: session.user.name?.split(' ')[0] || 'User',
    lastName: session.user.name?.split(' ')[1] || '',
    avatarUrl: null
  }

  return (
    <AuthLayout>
      <main className="p-6 max-w-md mx-auto">
        {/* Location header */}
        <LocationHeader user={userData} />
        
        {/* Action buttons */}
        <div className="space-y-4 mb-8">
          <Link
            href="/offers/new"
            className="block w-full bg-tan text-black border border-black p-4 rounded-md hover:bg-black hover:text-tan transition-colors text-center text-button"
          >
            Offer an item
          </Link>
          <Link
            href="/asks/new"
            className="block w-full bg-tan text-black border border-black p-4 rounded-md hover:bg-black hover:text-tan transition-colors text-center text-button"
          >
            Post an ask
          </Link>
        </div>

        {/* Your offered items */}
        <div>
          <h2 className="text-lg font-normal mb-4">Your offered items & asks</h2>
          <div className="space-y-4">
            {userOffers.length === 0 ? (
              <div className="border border-thin rounded-md p-6">
                <p className="text-body text-gray text-center">
                  You haven't created any offers or asks yet
                </p>
              </div>
            ) : (
              userOffers.map((offer: any) => (
                <OfferCard 
                  key={offer.id}
                  offer={offer}
                  currentUserId={session.user.id}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </AuthLayout>
  )
}