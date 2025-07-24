"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import AuthLayout from "@/components/AuthLayout"
import ProfileThumbnail from "@/components/ProfileThumbnail"
import { ChevronLeft, Send } from "lucide-react"
import Link from "next/link"
import { useUser } from "@/contexts/UserContext"
import BrownHatLoader from "@/components/BrownHatLoader"
import ReviewForm from "@/components/ReviewForm"
import Image from "next/image"
import { validateNoCurrency } from "@/lib/currencyFilter"

interface Message {
  id: string
  content: string
  senderId: string
  recipientId?: string
  createdAt: string
  isRead?: boolean
  sender: {
    id: string
    firstName: string
    lastName: string
  }
}

interface TradeData {
  id: string
  status?: string
  proposer: {
    id: string
    firstName: string
    lastName: string
  }
  offeredItem?: {
    id: string
    name: string
    imageUrl?: string
  }
  offeredItemInstance?: {
    id: string
    catalogItem: {
      name: string
      imageUrl?: string
    }
  }
  offer: {
    id: string
    title: string
    type?: string
    status?: string
    traveler: {
      id: string
      firstName: string
      lastName: string
    }
    item?: {
      name: string
      imageUrl?: string
    }
    itemInstance?: {
      id: string
      catalogItem: {
        name: string
        imageUrl?: string
      }
    }
  }
}

export default function MessagePage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ offerId: string, tradeId: string }>,
  searchParams: Promise<{ from?: string }>
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { refreshUser } = useUser()
  const [offerId, setOfferId] = useState<string>("")
  const [tradeId, setTradeId] = useState<string>("")
  const [fromPage, setFromPage] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [tradeData, setTradeData] = useState<TradeData | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState<string | false>(false)
  const [existingReview, setExistingReview] = useState<{ rating: number; content: string | null } | null>(null)
  const [isItemAvailable, setIsItemAvailable] = useState(true)
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set())
  const [showGiveItemModal, setShowGiveItemModal] = useState(false)
  const [inventoryItems, setInventoryItems] = useState<any[]>([])
  const [givingItem, setGivingItem] = useState(false)
  const [messageError, setMessageError] = useState("")
  const hasRefreshedUser = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    params.then(p => {
      setOfferId(p.offerId)
      setTradeId(p.tradeId)
      // Reset the ref when conversation changes
      hasRefreshedUser.current = false
    })
    searchParams.then(sp => {
      setFromPage(sp.from || 'messages')
    })
  }, [params, searchParams])

  const fetchData = async () => {
    if (!offerId || !tradeId) return

    try {
        // Fetch trade details
        const tradeResponse = await fetch(`/api/proposed-trades/${tradeId}`)
        if (!tradeResponse.ok) {
          router.push('/')
          return
        }
        const trade = await tradeResponse.json()
        setTradeData(trade)

        // Check if the offered item is available (not accepted in another trade)
        // Only check if current user is the offer owner and trade is not already accepted
        if (session?.user?.id === trade.offer.traveler.id && trade.status !== 'accepted') {
          try {
            const availabilityResponse = await fetch(`/api/proposed-trades/${tradeId}/availability`)
            if (availabilityResponse.ok) {
              const { isAvailable } = await availabilityResponse.json()
              setIsItemAvailable(isAvailable)
            }
          } catch (error) {
            console.error('Error checking item availability:', error)
            // Default to available if check fails
            setIsItemAvailable(true)
          }
        }

        // Fetch messages for this specific trade
        const messagesResponse = await fetch(`/api/messages/${offerId}/${tradeId}`)
        if (messagesResponse.ok) {
          const data = await messagesResponse.json()
          setMessages(data.messages || [])
          
          // Review form display is now handled by message-specific logic below
          
          // Refresh user context only once per conversation load
          if (!hasRefreshedUser.current) {
            hasRefreshedUser.current = true
            refreshUser()
          }

          // Scroll to bottom on initial load
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
          }, 100)
        }

        // Check if user has already reviewed
        if (trade.status === 'accepted' && session?.user?.id) {
          try {
            const reviewsResponse = await fetch('/api/reviews/pending')
            if (reviewsResponse.ok) {
              const { pendingReviews } = await reviewsResponse.json()
              const hasPendingReview = pendingReviews.some(
                (pr: any) => pr.proposedTradeId === tradeId
              )
              
              // If no pending review, check if already reviewed
              if (!hasPendingReview) {
                // We need to check if THIS USER has reviewed THIS TRADE
                // The /api/reviews/user endpoint returns reviews ABOUT that user, not BY that user
                // So we need a different approach - check the trade's reviews
                const tradeReviewsResponse = await fetch(`/api/proposed-trades/${tradeId}`)
                if (tradeReviewsResponse.ok) {
                  const tradeWithReviews = await tradeReviewsResponse.json()
                  // Find if current user has already reviewed this trade
                  const userReview = tradeWithReviews.reviews?.find(
                    (r: any) => r.reviewerId === session.user.id
                  )
                  if (userReview) {
                    setExistingReview({
                      rating: userReview.rating,
                      content: userReview.content
                    })
                    // Review form is now shown via message-specific buttons
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error checking review status:', error)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
  }

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push('/')
      return
    }

    fetchData()
  }, [offerId, tradeId, status, router, session?.user?.id])

  // Polling for new messages
  useEffect(() => {
    if (!offerId || !tradeId || !session?.user?.id) return

    // Function to poll for new messages
    const pollNewMessages = async () => {
      try {
        // Get the timestamp of the last message
        const lastMessage = messages[messages.length - 1]
        if (!lastMessage) return

        const response = await fetch(
          `/api/messages/${offerId}/${tradeId}?after=${lastMessage.createdAt}`
        )
        
        if (response.ok) {
          const data = await response.json()
          if (data.messages && data.messages.length > 0) {
            // Track new message IDs for animation
            const newIds = new Set<string>(data.messages.map((msg: Message) => msg.id))
            setNewMessageIds(newIds)
            
            // Add new messages to the state
            setMessages(prev => [...prev, ...data.messages])
            
            // Mark them as read if user is recipient
            const unreadMessages = data.messages.filter(
              (msg: Message) => msg.recipientId === session.user.id && !msg.isRead
            )
            
            if (unreadMessages.length > 0) {
              // Update unread count in user context
              refreshUser()
            }

            // Scroll to bottom when new messages arrive
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }, 100)

            // Remove animation class after animation completes
            setTimeout(() => {
              setNewMessageIds(new Set())
            }, 500)
          }
        }
      } catch (error) {
        console.error('Error polling for new messages:', error)
      }
    }

    // Poll every 3 seconds
    const interval = setInterval(pollNewMessages, 3000)

    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [offerId, tradeId, messages, session?.user?.id, refreshUser])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !tradeData) return

    // Validate message for currency content and inappropriate content
    const validation = validateNoCurrency(newMessage, "Messages", "message")
    if (!validation.isValid) {
      setMessageError(validation.error!)
      return
    }

    setMessageError("") // Clear any previous errors
    setSending(true)
    try {
      // Determine recipient based on who is sending
      const recipientId = session?.user?.id === tradeData.proposer.id 
        ? tradeData.offer.traveler.id 
        : tradeData.proposer.id

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: offerId,
          recipientId: recipientId,
          proposedTradeId: tradeId,
          content: newMessage
        })
      })

      if (response.ok) {
        const { message } = await response.json()
        setMessages([...messages, message])
        setNewMessage("")
        
        // Scroll to bottom after sending
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleAcceptTrade = async () => {
    if (!tradeData) return

    const isAccepted = tradeData.status === 'accepted'
    const newStatus = isAccepted ? 'pending' : 'accepted'
    const confirmMessage = isAccepted 
      ? 'Are you sure you want to cancel this trade?' 
      : 'Are you sure you want to accept this trade?'

    if (!confirm(confirmMessage)) return

    setAccepting(true)
    try {
      const response = await fetch(`/api/proposed-trades/${tradeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        const updatedTrade = await response.json()
        setTradeData({ ...tradeData, status: updatedTrade.status })
        
        // Refresh messages to show the system message
        const messagesResponse = await fetch(`/api/messages/${offerId}/${tradeId}`)
        if (messagesResponse.ok) {
          const data = await messagesResponse.json()
          setMessages(data.messages || [])
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update trade')
      }
    } catch (error) {
      console.error('Error updating trade:', error)
      alert('Failed to update trade')
    } finally {
      setAccepting(false)
    }
  }

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory')
      if (response.ok) {
        const data = await response.json()
        setInventoryItems(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    }
  }

  const handleSmartGiveItem = async () => {
    if (!otherUser || !tradeData) return
    
    setGivingItem(true)
    try {
      // Determine what item should be given based on trade context
      let itemToGive = null
      let itemName = ""
      
      // If current user is the offer owner and it's their inventory item
      if (session?.user?.id === tradeData.offer.traveler.id && tradeData.offer.itemInstance) {
        itemToGive = tradeData.offer.itemInstance
        itemName = tradeData.offer.itemInstance.catalogItem.name
      }
      // If current user is the proposer and it's their inventory item
      else if (session?.user?.id === tradeData.proposer.id && tradeData.offeredItemInstance) {
        itemToGive = tradeData.offeredItemInstance
        itemName = tradeData.offeredItemInstance.catalogItem.name
      }
      
      if (!itemToGive) {
        alert('No specific item found for this trade context')
        return
      }

      const response = await fetch('/api/items/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: otherUser.id,
          itemInstanceId: itemToGive.id,
          offerId: offerId,
          tradeId: tradeId
        })
      })

      if (response.ok) {
        // Refresh messages to show the system message
        const messagesResponse = await fetch(`/api/messages/${offerId}/${tradeId}`)
        if (messagesResponse.ok) {
          const data = await messagesResponse.json()
          setMessages(data.messages || [])
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to give item')
      }
    } catch (error) {
      console.error('Error giving item:', error)
      alert('Failed to give item')
    } finally {
      setGivingItem(false)
    }
  }

  const handleGiveInventoryItem = async (itemInstance: any) => {
    if (!otherUser) return
    
    setGivingItem(true)
    try {
      const response = await fetch('/api/items/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: otherUser.id,
          itemInstanceId: itemInstance.id,
          offerId: offerId,
          tradeId: tradeId
        })
      })

      if (response.ok) {
        setShowGiveItemModal(false)
        // Refresh messages to show the system message
        const messagesResponse = await fetch(`/api/messages/${offerId}/${tradeId}`)
        if (messagesResponse.ok) {
          const data = await messagesResponse.json()
          setMessages(data.messages || [])
        }
        // Refresh inventory
        fetchInventory()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to give item')
      }
    } catch (error) {
      console.error('Error giving item:', error)
      alert('Failed to give item')
    } finally {
      setGivingItem(false)
    }
  }

  const handleGiveNewItem = async (itemName: string, itemDescription?: string, itemImageUrl?: string) => {
    if (!otherUser) return
    
    // Validate item name and description for currency content and inappropriate content
    const nameValidation = validateNoCurrency(itemName, "Item name", "offer")
    if (!nameValidation.isValid) {
      alert(nameValidation.error!)
      return
    }

    if (itemDescription) {
      const descValidation = validateNoCurrency(itemDescription, "Item description", "offer")
      if (!descValidation.isValid) {
        alert(descValidation.error!)
        return
      }
    }
    
    setGivingItem(true)
    try {
      const response = await fetch('/api/items/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: otherUser.id,
          itemName: itemName,
          itemDescription: itemDescription,
          itemImageUrl: itemImageUrl,
          offerId: offerId,
          tradeId: tradeId
        })
      })

      if (response.ok) {
        setShowGiveItemModal(false)
        // Refresh messages to show the system message
        const messagesResponse = await fetch(`/api/messages/${offerId}/${tradeId}`)
        if (messagesResponse.ok) {
          const data = await messagesResponse.json()
          setMessages(data.messages || [])
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to give item')
      }
    } catch (error) {
      console.error('Error giving item:', error)
      alert('Failed to give item')
    } finally {
      setGivingItem(false)
    }
  }

  if (loading || !tradeData) {
    return (
      <AuthLayout variant="fullHeight">
        <div className="max-w-md mx-auto p-6 h-screen flex items-center justify-center">
          <BrownHatLoader size="large" text="Loading conversation..." />
        </div>
      </AuthLayout>
    )
  }

  const otherUser = session?.user?.id === tradeData.proposer.id 
    ? tradeData.offer.traveler 
    : tradeData.proposer

  const itemName = tradeData.offer.item?.name || 
                   tradeData.offer.itemInstance?.catalogItem?.name || 
                   tradeData.offer.title

  return (
    <AuthLayout variant="fullHeight">
      <div className="max-w-md mx-auto flex flex-col h-screen pb-16 overflow-hidden">
        {/* Fixed Header */}
        <div className="p-4 border-b border-gray/20 flex items-center bg-tan z-20 relative flex-shrink-0">
          <button 
            onClick={() => {
              if (fromPage === 'messages') {
                router.push('/messages')
              } else if (fromPage === 'search') {
                router.push('/search')
              } else if (fromPage.startsWith('offer-')) {
                const returnOfferId = fromPage.replace('offer-', '')
                router.push(`/offers/${returnOfferId}`)
              } else {
                router.push('/')
              }
            }}
            className="mr-3"
          >
            <ChevronLeft size={24} />
          </button>
          <Link href={`/offers/${offerId}?from=${encodeURIComponent(`conversation-${offerId}-${tradeId}`)}`} className="flex items-center justify-start flex-1 ml-[68px]">
            {/* Show offer item image for regular offers, or proposed item image for asks */}
            {(tradeData.offer.item?.imageUrl || tradeData.offeredItem?.imageUrl) && (
              <img
                src={tradeData.offer.item?.imageUrl || tradeData.offeredItem?.imageUrl}
                alt={itemName}
                className="w-10 h-10 object-cover rounded-lg mr-3"
              />
            )}
            <h1 className="text-header font-normal">{itemName}</h1>
          </Link>
        </div>

        {/* Fixed Trade Proposal Header */}
        <div className="bg-tan border-2 border-black rounded-sm mx-4 mt-2 z-10 relative flex-shrink-0">
          {/* Initial trade proposal message */}
          <div className="flex items-center p-3">
            <ProfileThumbnail 
              user={tradeData.proposer} 
              size="sm" 
              className="mr-2"
              fromPage={`/messages/${offerId}/${tradeId}`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-normal">{session?.user?.id === tradeData.proposer.id ? 'You' : tradeData.proposer.firstName}</span> {session?.user?.id === tradeData.proposer.id ? 'offer' : 'offers'} <span className="italic">{tradeData.offeredItem?.name || tradeData.offeredItemInstance?.catalogItem?.name}</span>
              </p>
            </div>
            {/* Accept trade button (only for offer owner and if offer not deleted) - moved inline */}
            {session?.user?.id === tradeData.offer.traveler.id && tradeData.offer.status !== 'deleted' && (
              <div className="ml-2 flex-shrink-0">
                {/* Show accept/cancel button based on trade status */}
                {tradeData.status === 'accepted' ? (
                  <button 
                    onClick={handleAcceptTrade}
                    disabled={accepting}
                    className="bg-tan text-black border border-black px-3 py-1 rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px] text-xs"
                  >
                    {accepting ? (
                      <div className="flex items-center">
                        <BrownHatLoader size="small" />
                        <span className="ml-1">...</span>
                      </div>
                    ) : 'Cancel trade'}
                  </button>
                ) : tradeData.status === 'unavailable' ? (
                  <div className="bg-gray/10 text-gray border border-gray/20 px-2 py-1 rounded-sm text-xs">
                    Unavailable
                  </div>
                ) : tradeData.status === 'pending' ? (
                  <button 
                    onClick={handleAcceptTrade}
                    disabled={accepting}
                    className="bg-tan text-black border border-black px-3 py-1 rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px] text-xs"
                  >
                    {accepting ? (
                      <div className="flex items-center">
                        <BrownHatLoader size="small" />
                        <span className="ml-1">...</span>
                      </div>
                    ) : 'Accept'}
                  </button>
                ) : (
                  <div className="bg-gray/10 text-gray border border-gray/20 px-2 py-1 rounded-sm text-xs">
                    {tradeData.status}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Messages Container - Only This Scrolls */}
        <div className="flex-1 overflow-hidden min-h-0">
          <div className="h-full overflow-y-auto p-4">
          {/* Other messages */}
          {messages.map((message, index) => {
            const isOwnMessage = message.senderId === session?.user?.id
            const isSystemMessage = !message.senderId
            
            // System messages
            if (isSystemMessage) {
              // Check if this is a review request message
              const isReviewRequest = message.content.includes('rate your experience')
              // Check if this is a review submission message
              const isReviewSubmission = message.content.includes('submitted a review') || message.content.includes('updated their review')
              
              // Find the most recent review submission message (only show button on the latest one)
              const isLatestReviewMessage = isReviewSubmission && (() => {
                // Find all review submission messages after this one
                const laterReviewMessages = messages.slice(index + 1).filter(msg => 
                  !msg.senderId && (msg.content.includes('submitted a review') || msg.content.includes('updated their review'))
                )
                return laterReviewMessages.length === 0 // This is the latest if no later ones exist
              })()
              
              return (
                <div key={message.id} className="mb-4">
                  <div className="bg-gray/10 rounded-sm p-3">
                    <p className="text-center text-gray text-sm">{message.content}</p>
                    
                    {/* Show Update review button only for the most recent review submission message */}
                    {isLatestReviewMessage && tradeData.status === 'accepted' && (
                      <>
                        <button
                          onClick={() => setShowReviewForm(showReviewForm ? false : message.id)}
                          className="w-full mt-3 bg-tan text-black border border-black p-2 rounded-sm hover:bg-black hover:text-tan transition-colors text-sm"
                        >
                          {showReviewForm === message.id ? 'Hide review form' : 'Update review'}
                        </button>
                        
                        {/* Inline Review Form */}
                        {showReviewForm === message.id && (
                          <div className="mt-3">
                            <ReviewForm
                              proposedTradeId={tradeId}
                              revieweeName={otherUser.firstName}
                              existingReview={existingReview || undefined}
                              onSubmit={() => {
                                // Hide the review form after submission
                                setShowReviewForm(false)
                                // Refresh messages to show the new system message
                                setTimeout(async () => {
                                  const messagesResponse = await fetch(`/api/messages/${offerId}/${tradeId}`)
                                  if (messagesResponse.ok) {
                                    const data = await messagesResponse.json()
                                    setMessages(data.messages || [])
                                    // Scroll to bottom to see new message
                                    setTimeout(() => {
                                      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
                                    }, 100)
                                  }
                                }, 500)
                              }}
                              inline={true}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Date outside the gray box, like regular messages */}
                  <p className="text-right text-xs text-gray mt-1">
                    {new Date(message.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )
            }
            
            // Regular messages
            const isNewMessage = newMessageIds.has(message.id)
            return (
              <div 
                key={message.id} 
                className={`flex items-start mb-4 ${
                  isNewMessage ? 'animate-slide-in-bottom' : ''
                }`}
              >
                <ProfileThumbnail 
                  user={message.sender} 
                  size="sm" 
                  className="mr-3"
                  fromPage={`/messages/${offerId}/${tradeId}`}
                />
                <div className="flex-1">
                  <div className="bg-tan border border-black rounded-sm p-3">
                    <p className="text-body">{message.content}</p>
                  </div>
                  <p className="text-xs text-gray mt-1 text-right">
                    {new Date(message.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )
          })}
          
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Fixed Bottom Section - either deleted message or input */}
        <div className="border-t border-gray/20 bg-tan relative z-10 flex-shrink-0">
          {tradeData.offer.status === 'deleted' ? (
            <div className="bg-gray/10 p-4">
              <p className="text-center text-gray text-sm">
                {tradeData.offer.type === 'ask' ? 'Ask' : 'Offer'} deleted
              </p>
            </div>
          ) : (
            <div className="p-4">
            <div className="space-y-2">
              <textarea
                value={newMessage}
                onChange={(e) => {
                  const value = e.target.value
                  // Real-time validation for currency content and inappropriate content
                  const validation = validateNoCurrency(value, "Messages", "message")
                  if (!validation.isValid) {
                    setMessageError(validation.error!)
                  } else {
                    setMessageError("")
                  }
                  setNewMessage(value)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                placeholder={`Write a message to ${otherUser.firstName}`}
                className="w-full p-3 border border-black rounded-sm resize-none h-20 text-body bg-tan placeholder-gray focus:outline-none focus:ring-1 focus:ring-black"
              />
              {messageError && (
                <div className="text-red-600 text-xs">{messageError}</div>
              )}
            </div>
            <div className="flex justify-between mt-3">
              <button
                onClick={() => {
                  // Check if there's a specific item to give based on trade context
                  let hasSpecificItem = false
                  let specificItemName = ""
                  
                  if (session?.user?.id === tradeData.offer.traveler.id && tradeData.offer.itemInstance) {
                    hasSpecificItem = true
                    specificItemName = tradeData.offer.itemInstance.catalogItem.name
                  } else if (session?.user?.id === tradeData.proposer.id && tradeData.offeredItemInstance) {
                    hasSpecificItem = true
                    specificItemName = tradeData.offeredItemInstance.catalogItem.name
                  }
                  
                  if (hasSpecificItem) {
                    const confirmed = confirm(
                      `⚠️ Important: Only click "Give Item" if you have already physically given "${specificItemName}" to ${otherUser.firstName} in person.\n\n` +
                      `This will:\n` +
                      `• Transfer "${specificItemName}" from your inventory to ${otherUser.firstName}'s inventory\n` +
                      `• Add it to their item collection\n` +
                      `• Create a permanent record in the item's history\n\n` +
                      `Have you already physically given "${specificItemName}" to ${otherUser.firstName}?`
                    )
                    
                    if (confirmed) {
                      handleSmartGiveItem()
                    }
                  } else {
                    const confirmed = confirm(
                      `⚠️ Important: Only click "Give Item" if you have already physically given the item to ${otherUser.firstName} in person.\n\n` +
                      `This will:\n` +
                      `• Move the item from your inventory to ${otherUser.firstName}'s inventory\n` +
                      `• Add it to their item collection\n` +
                      `• Create a permanent record in the item's history\n\n` +
                      `Have you already physically given the item to ${otherUser.firstName}?`
                    )
                    
                    if (confirmed) {
                      setShowGiveItemModal(true)
                      fetchInventory()
                    }
                  }
                }}
                disabled={givingItem}
                className="bg-tan text-black border-2 border-black px-2.5 py-1 rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-xs font-medium shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px]"
              >
                <Image 
                  src="/images/brownhat_final.png" 
                  alt="Give Item" 
                  width={16} 
                  height={16} 
                  className="mr-2" 
                />
                Give item
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                className="bg-tan text-black border-2 border-black px-2.5 py-1 rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-xs font-medium shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px]"
              >
                {sending ? (
                  <>
                    <BrownHatLoader size="small" />
                    <span className="ml-2">Sending...</span>
                  </>
                ) : (
                  <>
                    Send
                  </>
                )}
              </button>
            </div>
          </div>
          )}
        </div>

        {/* Give Item Modal */}
        {showGiveItemModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-tan border border-black rounded-sm max-w-md w-full max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b border-black">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-normal">Give Item to {otherUser.firstName}</h3>
                  <button
                    onClick={() => setShowGiveItemModal(false)}
                    className="text-black hover:text-gray"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="p-4 overflow-y-auto max-h-96">
                {/* Inventory Items */}
                {inventoryItems.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-body font-normal mb-3">From Your Inventory</h4>
                    <div className="space-y-2">
                      {inventoryItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 border border-black rounded-sm bg-white hover:shadow-[2px_2px_0px_#000000] transition-shadow"
                        >
                          <div className="flex items-center space-x-3">
                            {item.catalogItem.imageUrl ? (
                              <img
                                src={item.catalogItem.imageUrl}
                                alt={item.catalogItem.name}
                                className="w-10 h-10 object-cover rounded-sm"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded-sm"></div>
                            )}
                            <div>
                              <h5 className="font-normal">{item.catalogItem.name}</h5>
                              {item.catalogItem.description && (
                                <p className="text-sm text-gray">{item.catalogItem.description}</p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleGiveInventoryItem(item)}
                            disabled={givingItem}
                            className="bg-tan text-black border border-black px-3 py-1 rounded-sm text-sm hover:bg-black hover:text-tan transition-colors disabled:opacity-50"
                          >
                            {givingItem ? 'Giving...' : 'Give'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Give New Item */}
                <div>
                  <h4 className="text-body font-normal mb-3">Give New Item</h4>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      const formData = new FormData(e.target as HTMLFormElement)
                      const itemName = formData.get('itemName') as string
                      const itemDescription = formData.get('itemDescription') as string
                      if (itemName.trim()) {
                        handleGiveNewItem(itemName.trim(), itemDescription.trim() || undefined)
                      }
                    }}
                    className="space-y-3"
                  >
                    <input
                      name="itemName"
                      type="text"
                      placeholder="Item name (e.g., blue backpack)"
                      className="w-full p-3 border border-black rounded-sm bg-white placeholder-gray text-body focus:outline-none focus:ring-1 focus:ring-black"
                      required
                    />
                    <textarea
                      name="itemDescription"
                      placeholder="Description (optional)"
                      className="w-full p-3 border border-black rounded-sm bg-white placeholder-gray text-body focus:outline-none focus:ring-1 focus:ring-black resize-none"
                      rows={2}
                    />
                    <button
                      type="submit"
                      disabled={givingItem}
                      className="w-full bg-tan text-black border border-black py-2 rounded-sm hover:bg-black hover:text-tan transition-colors disabled:opacity-50"
                    >
                      {givingItem ? 'Giving...' : 'Give Item'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}