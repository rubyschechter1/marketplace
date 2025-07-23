"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import AuthLayout from "@/components/AuthLayout"
import ProfileThumbnail from "@/components/ProfileThumbnail"
import Link from "next/link"
import { MapPin, ChevronLeft } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useLocation } from "@/contexts/LocationContext"
import BrownHatLoader from "@/components/BrownHatLoader"

export default function OfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { location } = useLocation()
  const fromPage = searchParams.get('from')
  const [offer, setOffer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [offerId, setOfferId] = useState<string>("")
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedItem, setSubmittedItem] = useState<string | null>(null)
  const [userProposedItem, setUserProposedItem] = useState<string | null>(null)
  const [isOtherSelected, setIsOtherSelected] = useState(false)
  const [customItemText, setCustomItemText] = useState("")
  const [itemPhotoUrl, setItemPhotoUrl] = useState<string>("")
  const [itemPhotoPreview, setItemPhotoPreview] = useState<string>("")
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

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
        // Build URL with location parameters if available
        let url = `/api/offers/${offerId}`
        if (location.latitude && location.longitude) {
          url += `?lat=${location.latitude}&lng=${location.longitude}`
        }
        
        const response = await fetch(url)
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
  }, [offerId, status, router, session?.user?.id, location.latitude, location.longitude])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Photo must be less than 5MB")
      return
    }

    // Show preview immediately
    const reader = new FileReader()
    reader.onloadend = () => {
      setItemPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to server
    try {
      setIsUploadingPhoto(true)
      const formData = new FormData()
      formData.append("file", file)
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const { url } = await response.json()
      setItemPhotoUrl(url)
    } catch (error) {
      alert("Failed to upload photo")
      console.error("Upload error:", error)
      setItemPhotoPreview("")
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleDeleteOffer = async () => {
    if (!confirm('Are you sure you want to delete this offer?')) {
      return
    }

    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete offer')
      }

      router.push('/')
      router.refresh()
    } catch (error) {
      alert('Failed to delete offer')
      console.error('Delete error:', error)
    }
  }

  const handleSubmitOffer = async () => {
    const itemName = isOtherSelected ? customItemText : selectedItem
    if (!itemName) return
    
    setIsSubmitting(true)
    try {
      // First create an item for what the user is offering
      const itemResponse = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: itemName,
          description: '',
          imageUrl: itemPhotoUrl || null
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
      setSubmittedItem(itemName)
      setUserProposedItem(itemName)
      setSelectedItem(null)
      setIsOtherSelected(false)
      setCustomItemText("")
      setItemPhotoUrl("")
      setItemPhotoPreview("")
      
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
        <div className="max-w-md mx-auto p-6 h-screen flex items-center justify-center">
          <BrownHatLoader size="large" text="Loading offer..." />
        </div>
      </AuthLayout>
    )
  }

  const isOwner = session?.user?.id === offer.traveler?.id
  const displayName = isOwner ? "You" : `${offer.traveler?.firstName} ${offer.traveler?.lastName}`
  const isDeleted = offer.status === 'deleted'

  return (
    <AuthLayout>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="p-4 pb-0 flex justify-between items-center">
          <button 
            onClick={() => {
              if (fromPage?.startsWith('conversation-')) {
                // Parse the fromPage parameter to extract conversation details and original source
                const conversationData = fromPage.replace('conversation-', '')
                
                // Check if there's origin information
                if (conversationData.includes('-origin-')) {
                  const [conversationPart, originPart] = conversationData.split('-origin-')
                  const [conversationOfferId, tradeId] = conversationPart.split('-')
                  
                  if (conversationOfferId && tradeId) {
                    router.push(`/messages/${conversationOfferId}/${tradeId}?from=${encodeURIComponent(originPart)}`)
                  } else {
                    router.push('/')
                  }
                } else {
                  // Simple conversation format without origin
                  const parts = conversationData.split('-')
                  if (parts.length >= 2) {
                    const [conversationOfferId, tradeId] = parts
                    router.push(`/messages/${conversationOfferId}/${tradeId}`)
                  } else {
                    router.push('/')
                  }
                }
              } else {
                router.push('/')
              }
            }}
            className="inline-flex items-center text-black hover:text-gray ml-[3px]"
          >
            <ChevronLeft size={20} />
          </button>
          
          <h1 className="text-header font-normal flex-1 text-center mr-6">{offer.title}</h1>
        </div>
      </div>

      {/* Image - moved outside container - only for regular offers */}
      {offer.type !== 'ask' && offer.item?.imageUrl && (
        <div className="aspect-square absolute left-[26px] right-[26px] z-10" style={{ marginTop: '20px' }}>
          <img
            src={offer.item.imageUrl}
            alt={offer.item.name}
            className="w-full h-full object-cover rounded-sm"
          />
        </div>
      )}

      <div className="max-w-md mx-auto" style={{ marginTop: offer.type !== 'ask' && offer.item?.imageUrl ? '330px' : '0' }}>
        {/* Content */}
        <div className="p-6">
          
          {/* Deleted status banner */}
          {isDeleted && (
            <div className="bg-gray/10 border border-gray/20 rounded-sm p-3 mb-6 ml-6">
              <p className="text-center text-gray">
                This {offer.type === 'ask' ? 'ask' : 'offer'} has been deleted
              </p>
            </div>
          )}
          
          {/* Description - moved outside the box */}
          {offer.description && !isDeleted && (
            <div className="text-body mb-6 ml-[2px]">
              {offer.description}
            </div>
          )}

          {/* Offer Details Box with Profile Thumbnail */}
          <div className="flex items-start gap-3 mb-6">
            {offer.traveler && (
              <ProfileThumbnail 
                user={offer.traveler}
                size="sm"
                clickable={!isOwner}
                className=""
              />
            )}
            <div className="flex-1 rounded-sm p-4 border border-black">
              <div className="text-body mb-3">
                {offer.type === 'ask' ? (
                  <>
                    <span className="font-normal">{displayName}</span> {isOwner ? 'are' : 'is'} asking for{' '}
                    <span className="italic">{offer.title}</span>
                    {offer.askDescription && (
                      <div className="mt-2 text-sm text-gray">{offer.askDescription}</div>
                    )}
                  </>
                ) : (
                  <>
                    <span className="font-normal">{displayName}</span> {isOwner ? 'are' : 'is'} offering a{' '}
                    <span className="italic">{offer.item?.name || offer.title}</span>
                  </>
                )}
              </div>
            
            {offer.lookingFor && offer.lookingFor.length > 0 && !isDeleted && (
              <div className="text-body mb-4">
                {offer.type === 'ask' ? 'Can offer:' : 'Looking for:'}
                <div className="flex flex-wrap gap-2 mt-2">
                  {offer.lookingFor.map((item: string, index: number) => (
                    <button 
                      key={index}
                      className={`border px-3 py-1 rounded-sm text-sm transition-colors ${
                        isOwner 
                          ? 'bg-tan border-gray text-gray cursor-default' 
                          : userProposedItem
                          ? userProposedItem === item
                            ? 'bg-black text-tan border-black cursor-default'
                            : 'bg-tan border-gray text-gray cursor-default'
                          : submittedItem === item
                          ? 'bg-black text-tan border-black'
                          : selectedItem === item
                          ? 'bg-black text-tan border-black hover:bg-tan hover:text-black hover:border-black'
                          : 'bg-tan text-black border-black hover:bg-black hover:text-tan'
                      }`}
                      disabled={isOwner || !!userProposedItem}
                      onClick={() => {
                        if (!isOwner && !userProposedItem && submittedItem !== item) {
                          setSelectedItem(selectedItem === item ? null : item)
                          setIsOtherSelected(false)
                          setCustomItemText("")
                        }
                      }}
                    >
                      {item}
                    </button>
                  ))}
                  
                  {/* Other option */}
                  <button 
                    className={`border px-3 py-1 rounded-sm text-sm transition-colors ${
                      isOwner 
                        ? 'bg-tan border-gray text-gray cursor-default' 
                        : userProposedItem
                        ? 'bg-tan border-gray text-gray cursor-default'
                        : isOtherSelected
                        ? 'bg-black text-tan border-black hover:bg-tan hover:text-black hover:border-black'
                        : 'bg-tan text-black border-black hover:bg-black hover:text-tan'
                    }`}
                    disabled={isOwner || !!userProposedItem}
                    onClick={() => {
                      if (!isOwner && !userProposedItem) {
                        setIsOtherSelected(!isOtherSelected)
                        setSelectedItem(null)
                        if (!isOtherSelected) {
                          setCustomItemText("")
                        }
                      }
                    }}
                  >
                    other
                  </button>
                </div>
                
                {(selectedItem || isOtherSelected) && !submittedItem && !userProposedItem && (
                  <div className="mt-4">
                    {isOtherSelected ? (
                      <>
                        <div className="text-body mb-3">
                          {offer.type === 'ask' ? 'What are you offering?' : 'What are you offering?'}
                        </div>
                        <input
                          type="text"
                          value={customItemText}
                          onChange={(e) => setCustomItemText(e.target.value)}
                          placeholder="Enter item name"
                          className="w-full p-3 mb-3 border border-black rounded-sm bg-tan placeholder-gray text-body focus:outline-none focus:ring-1 focus:ring-black"
                          autoFocus
                        />
                      </>
                    ) : (
                      <div className="text-body mb-3">
                        You are offering <span className="italic">{selectedItem}</span>
                      </div>
                    )}
                    
                    {/* Photo upload for asks */}
                    {offer.type === 'ask' && (
                      <div className="mb-3">
                        <div className="text-body mb-2">
                          You have <span className="italic">{offer.title}</span>
                        </div>
                        <input
                          type="file"
                          id="ask-photo-upload"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                          disabled={isUploadingPhoto}
                        />
                        {itemPhotoPreview ? (
                          <div className="relative inline-block">
                            <img
                              src={itemPhotoPreview}
                              alt="Item preview"
                              className="w-24 h-24 object-cover rounded-sm"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setItemPhotoUrl("")
                                setItemPhotoPreview("")
                              }}
                              className="absolute -top-2 -right-2 bg-white border border-black rounded-full w-6 h-6 flex items-center justify-center hover:bg-tan"
                            >
                              <span className="text-sm leading-none">×</span>
                            </button>
                          </div>
                        ) : (
                          <label
                            htmlFor="ask-photo-upload"
                            className="inline-flex items-center px-3 py-2 bg-tan text-black border border-black rounded-sm hover:bg-black hover:text-tan transition-colors cursor-pointer text-sm"
                          >
                            {isUploadingPhoto ? "Uploading..." : "Add photo"}
                          </label>
                        )}
                      </div>
                    )}
                    
                    <button
                      onClick={handleSubmitOffer}
                      disabled={isSubmitting || (isOtherSelected && !customItemText.trim())}
                      className="bg-tan text-black border border-black px-4 py-2 rounded-sm hover:bg-black hover:text-tan transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <BrownHatLoader size="small" />
                          <span className="ml-2">Submitting...</span>
                        </div>
                      ) : "Submit offer"}
                    </button>
                  </div>
                )}
              </div>
            )}
            

              <div className="flex justify-end">
                <div className="flex items-center text-gray text-xs">
                  <MapPin size={12} className="mr-1" />
                  {offer.displayLocation || offer.locationName || "Location"}
                  {offer.distance !== undefined && ` · ${offer.distance}km`}
                </div>
              </div>
            </div>
          </div>

          {/* Proposed Trades */}
          <div>
            <h2 className="text-body font-normal mb-4 text-center ml-[52px]">Proposed trades</h2>
            
            <div className="space-y-3">
              {offer.proposedTrades?.map((trade: any) => {
                const isAccepted = trade.status === 'accepted'
                return (
                  <div key={trade.id} className="flex items-start gap-3">
                    <ProfileThumbnail 
                      user={trade.proposer}
                      size="sm"
                      className=""
                    />
                    <div className={`flex-1 rounded-sm p-4 ${isAccepted ? 'bg-black text-tan' : ''}`} style={{ border: '6px solid #000000' }}>
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          {isAccepted && (
                            <div className="mb-2">
                              <span className="font-bold">Accepted</span>
                            </div>
                          )}
                          <div className={`text-body ${isAccepted ? 'text-tan' : ''}`}>
                            <span className="font-normal">
                              {trade.proposer?.firstName} {trade.proposer?.lastName}
                            </span>{' '}
                            offers <span className="italic">{trade.offeredItem?.name}</span>
                          </div>
                        </div>
                      {/* Show item image for asks */}
                      {offer.type === 'ask' && trade.offeredItem?.imageUrl && (
                        <a 
                          href={trade.offeredItem.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img 
                            src={trade.offeredItem.imageUrl}
                            alt={trade.offeredItem.name}
                            className="w-16 h-16 object-cover rounded-md hover:opacity-80 transition-opacity cursor-pointer"
                          />
                        </a>
                      )}
                    </div>
                        <div className="flex justify-between items-end mt-3">
                          {isOwner && (
                            <button
                              onClick={() => {
                                // Just navigate to the conversation - no need for initial message
                                router.push(`/messages/${offer.id}/${trade.id}?from=offer-${offer.id}`)
                              }}
                              className={`${isAccepted ? 'bg-black text-tan border-tan hover:bg-tan hover:text-black' : 'bg-tan text-black border-black hover:bg-black hover:text-tan'} border px-3 py-1 rounded-sm text-sm transition-colors`}
                            >
                              message
                            </button>
                          )}
                          <div className={`text-xs ${isAccepted ? 'text-tan' : 'text-gray'} flex items-center ${!isOwner ? 'ml-auto' : ''}`}>
                            <MapPin size={10} className="mr-1" />
                            {offer.displayLocation || offer.locationName || "Unknown"}
                            {offer.distance !== undefined && ` · ${offer.distance}km`}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

              {(!offer.proposedTrades || offer.proposedTrades.length === 0) && (
                <p className="text-body text-gray text-center ml-[52px]">No proposed trades yet</p>
              )}
            </div>
          </div>

          {/* Delete button - only for owner and not already deleted */}
          {isOwner && !isDeleted && (
            <div className="mt-8 mb-4 ml-[52px]">
              <button
                onClick={handleDeleteOffer}
                className="w-full bg-tan text-black border border-black p-3 rounded-sm hover:bg-black hover:text-tan hover:border-black transition-colors"
              >
                Delete {offer.type === 'ask' ? 'ask' : 'offer'}
              </button>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}