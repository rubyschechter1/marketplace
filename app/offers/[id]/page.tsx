import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import AuthLayout from "@/components/AuthLayout"
import Link from "next/link"
import { MapPin, ChevronLeft } from "lucide-react"
import { redirect } from "next/navigation"

async function getOfferDetails(id: string) {
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/offers/${id}`, {
    cache: 'no-store'
  })
  
  if (!response.ok) {
    return null
  }
  
  return response.json()
}

export default async function OfferPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/')
  }

  const { id } = await params
  const offer = await getOfferDetails(id)
  
  if (!offer) {
    redirect('/')
  }

  const isOwner = session.user?.id === offer.traveler?.id
  const displayName = isOwner ? "You" : `${offer.traveler?.firstName} ${offer.traveler?.lastName}`
  
  // Mock location data for now
  const distance = "3km"

  return (
    <AuthLayout>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="p-4 pb-0">
          <Link href="/" className="inline-flex items-center text-gray hover:text-black mb-4">
            <ChevronLeft size={20} className="mr-1" />
            Back
          </Link>
        </div>

        {/* Image */}
        {offer.item?.imageUrl && (
          <div className="relative aspect-square">
            <img
              src={offer.item.imageUrl}
              alt={offer.item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Title */}
          <h1 className="text-header font-normal mb-6">{offer.item?.name || offer.title}</h1>

          {/* Offer Details Box */}
          <div className="border border-black rounded-sm p-4 mb-6">
            <div className="text-body mb-3">
              <span className="font-normal">{displayName}</span> {isOwner ? 'are' : 'is'} offering a{' '}
              <span className="italic">{offer.item?.name || offer.title}</span>
            </div>
            
            <div className="text-body mb-4">
              Looking for:
              <div className="flex flex-wrap gap-2 mt-2">
                <button 
                  className={`border ${isOwner ? 'border-gray text-gray cursor-default' : 'border-black hover:bg-white'} px-3 py-1 rounded-sm text-sm transition-colors`}
                  disabled={isOwner}
                >
                  iphone charger
                </button>
                <button 
                  className={`border ${isOwner ? 'border-gray text-gray cursor-default' : 'border-black hover:bg-white'} px-3 py-1 rounded-sm text-sm transition-colors`}
                  disabled={isOwner}
                >
                  travel tips
                </button>
                <button 
                  className={`border ${isOwner ? 'border-gray text-gray cursor-default' : 'border-black hover:bg-white'} px-3 py-1 rounded-sm text-sm transition-colors`}
                  disabled={isOwner}
                >
                  offer
                </button>
              </div>
            </div>

            <div className="flex items-center text-gray text-sm">
              <MapPin size={14} className="mr-1" />
              {offer.locationName || "Location"} · {distance}
            </div>
          </div>

          {/* Proposed Trades */}
          <div>
            <h2 className="text-body font-normal mb-4">Proposed trades</h2>
            
            <div className="space-y-3">
              {offer.proposedTrades?.map((trade: any) => (
                <div key={trade.id} className="border border-black rounded-sm p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-gray/20 rounded-full flex items-center justify-center text-sm mr-3 flex-shrink-0">
                        {trade.proposer?.firstName?.[0] || 'U'}
                      </div>
                      <div>
                        <div className="text-body">
                          <span className="font-normal">
                            {trade.proposer?.firstName} {trade.proposer?.lastName}
                          </span>{' '}
                          is willing to trade a{' '}
                          <span className="italic">{trade.offeredItem?.name}</span>
                        </div>
                        {trade.offeredItem?.description && (
                          <p className="text-sm text-gray mt-1">
                            {trade.offeredItem.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {isOwner && (
                      <button className="ml-4 border border-black px-3 py-1 rounded-sm text-sm hover:bg-white transition-colors whitespace-nowrap">
                        accept trade
                      </button>
                    )}
                  </div>
                  <div className="text-sm text-gray mt-2 ml-13">
                    Location: {offer.locationName || "Unknown"} ({distance})
                  </div>
                </div>
              ))}

              {(!offer.proposedTrades || offer.proposedTrades.length === 0) && (
                <p className="text-body text-gray">No proposed trades yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}