"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import AuthLayout from "@/components/AuthLayout"
import ProfileThumbnail from "@/components/ProfileThumbnail"
import Link from "next/link"
import Image from "next/image"
import { MapPin, ChevronLeft, PackageOpen } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useLocation } from "@/contexts/LocationContext"
import BrownHatLoader from "@/components/BrownHatLoader"
import { validateNoCurrency } from "@/lib/currencyFilter"
import { getDisplayName } from "@/lib/formatName"

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
  const [showInventoryModal, setShowInventoryModal] = useState(false)
  const [inventoryItems, setInventoryItems] = useState<any[]>([])
  const [loadingInventory, setLoadingInventory] = useState(false)
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<any>(null)
  const [customItemError, setCustomItemError] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

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

  const fetchInventory = async () => {
    setLoadingInventory(true)
    try {
      const response = await fetch('/api/inventory')
      if (response.ok) {
        const data = await response.json()
        setInventoryItems(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoadingInventory(false)
    }
  }

  const handleInventoryItemSelect = (item: any) => {
    setSelectedInventoryItem(item)
    setSelectedItem(null)
    setIsOtherSelected(false)
    setCustomItemText("")
    setItemPhotoUrl(item.imageUrl || "")
    setItemPhotoPreview(item.imageUrl || "")
    setShowInventoryModal(false)
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
    let itemName = ""
    let tradeData: any = { offerId: offer.id }
    
    if (selectedInventoryItem) {
      itemName = selectedInventoryItem.name
      tradeData.offeredItemId = selectedInventoryItem.id
    } else {
      itemName = isOtherSelected ? customItemText : (selectedItem || "")
      if (!itemName) return
      
      // Validate item name for currency content and inappropriate content
      const validation = validateNoCurrency(itemName, "Item name", "offer")
      if (!validation.isValid) {
        setCustomItemError(validation.error!)
        return
      }
      
      // Create an item for what the user is offering
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
      tradeData.offeredItemId = item.id
    }
    
    setIsSubmitting(true)
    try {
      // Create the proposed trade
      const tradeResponse = await fetch('/api/proposed-trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeData)
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
      setSelectedInventoryItem(null)
      
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
  const displayName = getDisplayName(
    { id: offer.traveler?.id || '', firstName: offer.traveler?.firstName || '', lastName: offer.traveler?.lastName },
    session?.user?.id
  )
  const isDeleted = offer.status === 'deleted'

  return (
    <AuthLayout>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="p-4 pb-0 flex justify-between items-center">
          <button 
            onClick={() => {
              // Try using window.history.back() if from conversation
              if (fromPage?.startsWith('conversation-')) {
                window.history.back()
              } else if (fromPage === 'home') {
                router.push('/')
              } else if (fromPage === '/search') {
                router.push('/search')
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
        <div className="flex justify-center" style={{ marginTop: '20px' }}>
          <div className="relative w-64 h-64">
            <img
              src={offer.item.imageUrl}
              alt={offer.item.name}
              className="w-full h-full object-cover rounded-sm"
            />
            {/* Item History Button */}
            {offer.item && (
              <Link 
                href={`/history/${offer.item.id}`}
                className="absolute -bottom-10 right-0 bg-tan text-black border border-black px-3 py-1 rounded-sm text-sm hover:bg-black hover:text-tan transition-colors shadow-[2px_2px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[1px] hover:translate-y-[1px]"
              >
                Item History
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto" style={{ marginTop: offer.type !== 'ask' && offer.item?.imageUrl ? '30px' : '0' }}>
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
            <div className="text-body mb-6 flex justify-center">
              <div className="w-64">
                {offer.description}
              </div>
            </div>
          )}

          {/* Offer Details Box with Profile Thumbnail */}
          <div className="flex justify-center items-start gap-3 mb-6" style={{ marginLeft: '-50px' }}>
            {offer.traveler && (
              <ProfileThumbnail 
                user={offer.traveler}
                size="sm"
                clickable={!isOwner}
                className=""
              />
            )}
            <div className="w-64 rounded-sm p-4 border border-black">
              <div className="flex-1">
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
                      className={`px-3 py-1 rounded-sm text-sm transition-all ${
                        isOwner 
                          ? 'bg-tan border border-gray text-gray cursor-default' 
                          : userProposedItem
                          ? userProposedItem === item
                            ? 'bg-tan text-black border-2 border-black cursor-default'
                            : 'bg-tan border border-gray text-gray cursor-default'
                          : submittedItem === item
                          ? 'bg-tan text-black border-2 border-black'
                          : selectedItem === item
                          ? 'bg-tan text-black border-2 border-black hover:border-1'
                          : 'bg-tan text-black border border-black hover:border-1 hover:border-black'
                      }`}
                      disabled={isOwner || !!userProposedItem}
                      onClick={() => {
                        if (!isOwner && !userProposedItem && submittedItem !== item) {
                          setSelectedItem(selectedItem === item ? null : item)
                          setIsOtherSelected(false)
                          setCustomItemText("")
                          setSelectedInventoryItem(null)
                        }
                      }}
                    >
                      {item}
                    </button>
                  ))}
                  
                  {/* Other option */}
                  <button 
                    className={`px-3 py-1 rounded-sm text-sm transition-all ${
                      isOwner 
                        ? 'bg-tan border border-gray text-gray cursor-default' 
                        : userProposedItem
                        ? 'bg-tan border border-gray text-gray cursor-default'
                        : isOtherSelected
                        ? 'bg-tan text-black border-2 border-black hover:border-1'
                        : 'bg-tan text-black border border-black hover:border-1 hover:border-black'
                    }`}
                    disabled={isOwner || !!userProposedItem}
                    onClick={() => {
                      if (!isOwner && !userProposedItem) {
                        setIsOtherSelected(!isOtherSelected)
                        setSelectedItem(null)
                        setSelectedInventoryItem(null)
                        if (!isOtherSelected) {
                          setCustomItemText("")
                        }
                      }
                    }}
                  >
                    other
                  </button>
                  
                  {/* From Inventory option */}
                  <button 
                    className={`px-3 py-1 rounded-sm text-sm transition-all flex items-center ${
                      isOwner 
                        ? 'bg-tan border border-gray text-gray cursor-default' 
                        : userProposedItem
                        ? 'bg-tan border border-gray text-gray cursor-default'
                        : selectedInventoryItem
                        ? 'bg-tan text-black border-2 border-black hover:border-1'
                        : 'bg-tan text-black border border-black hover:border-1 hover:border-black'
                    }`}
                    disabled={isOwner || !!userProposedItem}
                    onClick={() => {
                      if (!isOwner && !userProposedItem) {
                        setShowInventoryModal(true)
                        fetchInventory()
                      }
                    }}
                  >
                    <Image src="/images/backpack_icon.png" alt="Inventory" width={14} height={14} className="mr-1" />
                    from inventory
                  </button>
                </div>
                
                {(selectedItem || isOtherSelected || selectedInventoryItem) && !submittedItem && !userProposedItem && (
                  <div className="mt-4">
                    {selectedInventoryItem ? (
                      <div className="text-body mb-3">
                        You are offering <span className="italic">{selectedInventoryItem.name}</span> from your inventory
                      </div>
                    ) : isOtherSelected ? (
                      <>
                        <div className="text-body mb-3">
                          {offer.type === 'ask' ? 'What are you offering?' : 'What are you offering?'}
                        </div>
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={customItemText}
                            onChange={(e) => {
                              const value = e.target.value
                              // Real-time validation for currency content and inappropriate content
                              const validation = validateNoCurrency(value, "Custom item name", "offer")
                              if (!validation.isValid) {
                                setCustomItemError(validation.error!)
                              } else {
                                setCustomItemError("")
                              }
                              setCustomItemText(value)
                            }}
                            placeholder="Enter item name"
                            className="w-full p-3 border border-black rounded-sm bg-tan placeholder-gray text-body focus:outline-none focus:ring-1 focus:ring-black"
                            autoFocus
                          />
                          {customItemError && (
                            <div className="text-red-600 text-xs">{customItemError}</div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-body mb-3">
                        You are offering <span className="italic">{selectedItem}</span>
                      </div>
                    )}
                    
                    {/* Photo upload for asks - only show when not using inventory item */}
                    {offer.type === 'ask' && !selectedInventoryItem && (
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
                      className="bg-tan text-black border border-black px-4 py-2 rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px]"
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
          </div>

          {/* Proposed Trades */}
          <div>
            <h2 className="text-body font-normal mb-4 text-center">Proposed trades</h2>
            
            <div className="space-y-3">
              {offer.proposedTrades?.map((trade: any) => {
                const isAccepted = trade.status === 'accepted'
                return (
                  <div key={trade.id} className="flex justify-center items-start gap-3" style={{ marginLeft: '-50px' }}>
                    <ProfileThumbnail 
                      user={trade.proposer}
                      size="sm"
                      className=""
                    />
                    <div className={`w-64 rounded-sm p-4 border border-black ${isAccepted ? 'bg-black text-tan' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          {isAccepted && (
                            <div className="mb-2">
                              <span className="font-bold">Accepted</span>
                            </div>
                          )}
                          <div className={`text-body ${isAccepted ? 'text-tan' : ''}`}>
                            <span className="font-normal">
                              {getDisplayName(
              { id: trade.proposer?.id || '', firstName: trade.proposer?.firstName || '', lastName: trade.proposer?.lastName },
              session?.user?.id
            )}
                            </span>{' '}
                            {session?.user?.id === trade.proposer?.id ? 'offer' : 'offers'} <span className="italic">{trade.offeredItem?.name}</span>
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
                <p className="text-body text-gray text-center">No proposed trades yet</p>
              )}
            </div>
          </div>

          {/* Delete button - only for owner and not already deleted */}
          {isOwner && !isDeleted && (
            <div className="mt-8 mb-4 flex justify-center">
              <div className="w-64">
              <button
                onClick={handleDeleteOffer}
                className="w-full bg-tan text-black border border-black p-3 rounded-sm hover:bg-black hover:text-tan hover:border-black transition-colors"
              >
                Delete {offer.type === 'ask' ? 'ask' : 'offer'}
              </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Inventory Selection Modal */}
      {showInventoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-tan border border-black rounded-sm max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-black">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-normal">Select from Inventory</h3>
                <button
                  onClick={() => setShowInventoryModal(false)}
                  className="text-black hover:text-gray"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-96">
              {loadingInventory ? (
                <div className="text-center py-8">
                  <p className="text-body">Loading inventory...</p>
                </div>
              ) : inventoryItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-body text-gray">No items in your inventory yet.</p>
                  <p className="text-sm text-gray mt-2">Items you receive from trades will appear here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {inventoryItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border border-black rounded-sm bg-white hover:shadow-[2px_2px_0px_#000000] transition-shadow"
                    >
                      <div className="flex items-center space-x-3">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-sm flex items-center justify-center">
                            <PackageOpen size={16} className="text-gray" />
                          </div>
                        )}
                        <div>
                          <h5 className="font-normal">{item.name}</h5>
                          {item.description && (
                            <p className="text-sm text-gray">{item.description}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleInventoryItemSelect(item)}
                        className="bg-tan text-black border border-black px-3 py-1 rounded-sm text-sm hover:bg-black hover:text-tan transition-colors"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-tan border-2 border-black rounded-sm p-6 max-w-sm w-full">
            <h3 className="text-lg font-normal mb-4 text-center">
              Delete {offer.type === 'ask' ? 'Ask' : 'Offer'}?
            </h3>
            <p className="text-sm text-gray mb-6 text-center">
              Are you sure you want to delete this {offer.type === 'ask' ? 'ask' : 'offer'}?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-tan text-black border border-black rounded-sm text-sm hover:bg-gray/10 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOffer}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white border border-red-600 rounded-sm text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-tan border-2 border-black rounded-sm p-6 max-w-sm w-full">
            <h3 className="text-lg font-normal mb-4 text-center">
              Error
            </h3>
            <p className="text-sm text-gray mb-6 text-center">
              {errorMessage}
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-4 py-2 bg-tan text-black border border-black rounded-sm text-sm shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}