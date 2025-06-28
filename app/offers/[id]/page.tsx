"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import AuthLayout from "@/components/AuthLayout"
import Link from "next/link"
import { MapPin, ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function OfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [offer, setOffer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [offerId, setOfferId] = useState<string>("")
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedItem, setSubmittedItem] = useState<string | null>(null)
  const [userProposedItem, setUserProposedItem] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => setOfferId(p.id))
  }, [params])

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push('/')
      return
    }

    async function fetchOffer() {
      if (!offerId) return
      
      try {
        const response = await fetch(`/api/offers/${offerId}`)
        if (!response.ok) {
          router.push('/')
          return
        }
        const data = await response.json()
        setOffer(data)
        
        // Check if current user has already proposed a trade
        if (session?.user?.id && data.proposedTrades) {
          const userTrade = data.proposedTrades.find((trade: any) => 
            trade.proposer?.id === session.user.id
          )
          if (userTrade) {
            setUserProposedItem(userTrade.offeredItem?.name)
          }
        }
      } catch (error) {
        console.error('Error fetching offer:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    fetchOffer()
  }, [offerId, status, router, session?.user?.id])

  const handleSubmitOffer = async () => {
    if (!selectedItem) return
    
    setIsSubmitting(true)
    try {
      // First create an item for what the user is offering
      const itemResponse = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedItem,
          description: ''
        })
      })
      
      if (!itemResponse.ok) {
        throw new Error('Failed to create item')
      }
      
      const { item } = await itemResponse.json()
      
      // Then create the proposed trade
      const tradeResponse = await fetch('/api/proposed-trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: offer.id,
          offeredItemId: item.id
        })
      })
      
      if (!tradeResponse.ok) {
        throw new Error('Failed to propose trade')
      }
      
      // Mark this item as submitted and refresh the offer
      setSubmittedItem(selectedItem)
      setUserProposedItem(selectedItem)
      setSelectedItem(null)
      
      // Refresh offer data to show new proposed trade
      const response = await fetch(`/api/offers/${offerId}`)
      const data = await response.json()
      setOffer(data)
    } catch (error) {
      console.error('Error submitting offer:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || !offer) {
    return (
      <AuthLayout>
        <div className="max-w-md mx-auto p-6">
          <p>Loading...</p>
        </div>
      </AuthLayout>
    )
  }

  const isOwner = session?.user?.id === offer.traveler?.id
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
            
            {offer.lookingFor && offer.lookingFor.length > 0 && (
              <div className="text-body mb-4">
                Looking for:
                <div className="flex flex-wrap gap-2 mt-2">
                  {offer.lookingFor.map((item: string, index: number) => (
                    <button 
                      key={index}
                      className={`border px-3 py-1 rounded-sm text-sm transition-colors ${
                        isOwner 
                          ? 'border-gray text-gray cursor-default' 
                          : userProposedItem
                          ? userProposedItem === item
                            ? 'bg-black text-white border-black cursor-default'
                            : 'border-gray text-gray cursor-default'
                          : submittedItem === item
                          ? 'bg-black text-white border-black'
                          : selectedItem === item
                          ? 'bg-black text-white border-black hover:bg-gray hover:border-gray'
                          : 'border-black hover:bg-white'
                      }`}
                      disabled={isOwner || !!userProposedItem}
                      onClick={() => {
                        if (!isOwner && !userProposedItem && submittedItem !== item) {
                          setSelectedItem(selectedItem === item ? null : item)
                        }
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                
                {selectedItem && !submittedItem && !userProposedItem && (
                  <div className="mt-4">
                    <div className="text-body mb-3">
                      You are offering <span className="italic">{selectedItem}</span>
                    </div>
                    <button
                      onClick={handleSubmitOffer}
                      disabled={isSubmitting}
                      className="bg-black text-white px-4 py-2 rounded-sm hover:bg-gray transition-colors disabled:bg-gray disabled:cursor-not-allowed text-sm"
                    >
                      {isSubmitting ? "Submitting..." : "Submit offer"}
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {offer.description && (
              <div className="text-body mb-4">
                {offer.description}
              </div>
            )}

            <div className="flex justify-end">
              <div className="flex items-center text-gray text-xs">
                <MapPin size={12} className="mr-1" />
                {offer.locationName || "Location"} · {distance}
              </div>
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
                      <div className="flex-1">
                        <div className="text-body">
                          <span className="font-normal">
                            {trade.proposer?.firstName} {trade.proposer?.lastName}
                          </span>{' '}
                          offered <span className="italic">{trade.offeredItem?.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-end mt-3">
                    {isOwner && (
                      <button
                        onClick={() => {
                          // Just navigate to the conversation - no need for initial message
                          router.push(`/messages/${offer.id}/${trade.id}`)
                        }}
                        className="border border-black px-3 py-1 rounded-sm text-sm hover:bg-white transition-colors"
                      >
                        message
                      </button>
                    )}
                    <div className={`text-xs text-gray flex items-center ${!isOwner ? 'ml-auto' : ''}`}>
                      <MapPin size={10} className="mr-1" />
                      {offer.locationName || "Unknown"} · {distance}
                    </div>
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