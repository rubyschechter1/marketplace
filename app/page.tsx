import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import AuthForms from "@/components/AuthForms"
import SignOutButton from "@/components/SignOutButton"
import AuthLayout from "@/components/AuthLayout"
import Link from "next/link"
import { MapPin } from "lucide-react"
import { cookies } from "next/headers"

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

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return (
      <main className="min-h-screen p-4 max-w-md mx-auto flex flex-col justify-center">
        <div className="text-center mb-8">
          <img 
            src="/images/brownhat.png" 
            alt="Marketplace" 
            className="w-48 h-48 mx-auto mb-4 object-contain"
          />
          <p className="text-gray-600">Barter with fellow travelers</p>
        </div>
        
        <AuthForms />
      </main>
    )
  }

  // Get user's offers via API
  const userOffers = await getUserOffers()

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
        
        <Link
          href="/offers/new"
          className="block w-full bg-tan text-black border border-black p-4 rounded-sm hover:bg-white transition-colors text-center text-button mb-8"
        >
          Offer an item
        </Link>

        {/* Your offered items */}
        <div>
          <h2 className="text-body font-normal mb-4">Your offered items</h2>
          <div className="space-y-3">
            {userOffers.length === 0 ? (
              <div className="border border-thin rounded-sm p-6">
                <p className="text-body text-gray text-center">
                  You haven't offered any items yet
                </p>
              </div>
            ) : (
              userOffers.map((offer: any) => (
                <Link
                  key={offer.id}
                  href={`/offers/${offer.id}`}
                  className="block border border-black rounded-sm overflow-hidden hover:bg-white transition-colors"
                >
                  <div className="flex">
                    {offer.item?.imageUrl && (
                      <img
                        src={offer.item.imageUrl}
                        alt={offer.item.name}
                        className="w-24 h-24 object-cover border-r border-black"
                      />
                    )}
                    <div className="flex-1 p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-body font-normal">{offer.item?.name || offer.title}</h3>
                        {offer._count.messages > 0 && (
                          <span className="text-xs bg-black text-white px-2 py-1 rounded-sm">
                            {offer._count.messages} message{offer._count.messages !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {offer.locationName && (
                        <div className="flex items-center text-gray text-sm">
                          <MapPin size={14} className="mr-1" />
                          {offer.locationName}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </AuthLayout>
  )
}