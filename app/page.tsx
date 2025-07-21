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

  console.log("🏠 Home page - session:", session ? "EXISTS" : "NULL")

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
            className="block w-full bg-tan text-black border border-black p-4 rounded-sm hover:bg-black hover:text-tan transition-colors text-center text-button"
          >
            Offer an item
          </Link>
          <Link
            href="/asks/new"
            className="block w-full bg-tan text-black border border-black p-4 rounded-sm hover:bg-black hover:text-tan transition-colors text-center text-button"
          >
            Post an ask
          </Link>
        </div>

        {/* Separate offers and asks */}
        {(() => {
          const offers = userOffers.filter((offer: any) => offer.type !== 'ask')
          const asks = userOffers.filter((offer: any) => offer.type === 'ask')
          
          return (
            <>
              {/* Your offers */}
              <div className="mb-8">
                <h2 className="text-lg font-normal mb-4 text-center">Your offered items</h2>
                {offers.length === 0 ? (
                  <div className="border border-thin rounded-sm p-6">
                    <p className="text-body text-gray text-center">
                      You haven't created any offers yet
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-8">
                    {offers.map((offer: any) => (
                      <Link 
                        key={offer.id}
                        href={`/offers/${offer.id}`}
                        className="block relative hover:ring-2 hover:ring-black transition-all rounded-sm"
                      >
                        {offer.item?.imageUrl ? (
                          <img 
                            src={offer.item.imageUrl}
                            alt={offer.item.name}
                            className="w-full aspect-square object-cover rounded-sm"
                          />
                        ) : (
                          <div className="w-full aspect-square bg-gray/20 rounded-sm flex items-center justify-center hover:bg-gray/30 transition-colors">
                            <span className="text-gray text-sm text-center px-2">
                              {offer.item?.name || offer.title}
                            </span>
                          </div>
                        )}
                        {/* Offer count in bottom left */}
                        <div className="absolute bottom-3 left-3 bg-tan text-black border border-black text-xs px-2 py-1 rounded-sm">
                          {offer._count?.proposedTrades || 0} offer{(offer._count?.proposedTrades || 0) !== 1 ? 's' : ''}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Your asks */}
              <div>
                <h2 className="text-lg font-normal mb-4 text-center">Your asks</h2>
                {asks.length === 0 ? (
                  <div className="border border-thin rounded-sm p-6">
                    <p className="text-body text-gray text-center">
                      You haven't created any asks yet
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-8">
                    {asks.map((ask: any) => (
                      <Link 
                        key={ask.id}
                        href={`/offers/${ask.id}`}
                        className="block bg-tan border border-black rounded-sm p-8 hover:bg-black hover:text-tan transition-colors relative aspect-square flex items-center justify-center"
                      >
                        <div className="text-center">
                          <p className="text-lg font-normal italic mb-2">
                            {ask.title}
                          </p>
                        </div>
                        {/* Offer count in bottom left */}
                        <div className="absolute bottom-3 left-3 bg-tan text-black border border-black text-xs px-2 py-1 rounded-sm">
                          {ask._count?.proposedTrades || 0} offer{(ask._count?.proposedTrades || 0) !== 1 ? 's' : ''}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          )
        })()}
      </main>
    </AuthLayout>
  )
}