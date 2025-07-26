"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import AuthLayout from "@/components/AuthLayout"
import ProfileThumbnail from "@/components/ProfileThumbnail"
import { ChevronLeft, Send, X } from "lucide-react"
import Link from "next/link"
import { useUser } from "@/contexts/UserContext"
import { useLocation } from "@/contexts/LocationContext"
import BrownHatLoader from "@/components/BrownHatLoader"
import ReviewForm from "@/components/ReviewForm"
import Image from "next/image"
import { formatDisplayName, getDisplayName } from "@/lib/formatName"

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
      id: string
      name: string
      imageUrl?: string
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
  const { location, refreshLocation } = useLocation()
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
  const [givingItem, setGivingItem] = useState(false)
  const [showTradeReviewModal, setShowTradeReviewModal] = useState(false)
  const [showAcceptConfirmModal, setShowAcceptConfirmModal] = useState(false)
  const [pendingTradeAction, setPendingTradeAction] = useState<'accept' | 'cancel' | null>(null)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [messageError, setMessageError] = useState("")
  const [itemAlreadyGiven, setItemAlreadyGiven] = useState(false)
  const hasRefreshedUser = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Format personalized system messages
  const formatSystemMessage = (content: string): string => {
    if (content.startsWith('TRADE_ACCEPTED:')) {
      const [, actorId, actorName] = content.split(':')
      const displayName = session?.user?.id === actorId ? 'You' : actorName
      return `${displayName} accepted the trade! The [SEND_ITEM_BUTTON] button has now been activated.\nOnce both parties click "send item" and review the trade, your new item will be found in your inventory!`
    }
    
    if (content.startsWith('TRADE_CANCELED:')) {
      const [, actorId, actorName] = content.split(':')
      const displayName = session?.user?.id === actorId ? 'You' : actorName
      return `${displayName} canceled the trade`
    }
    
    if (content.startsWith('ITEM_GIVEN:')) {
      const [, actorId, actorName, itemName] = content.split(':')
      if (session?.user?.id === actorId) {
        return `You gave ${itemName}! The recipient can find their new item in their inventory.`
      } else {
        return `${actorName} has given you ${itemName}! You can find your new item in your inventory.`
      }
    }
    
    return content // Return original content for other system messages
  }

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

  // Check if item has already been given based on system messages or automatic trade transfers
  const checkIfItemAlreadyGiven = () => {
    if (!session?.user?.id || !tradeData) return false
    
    // Check if trade involves inventory items and has been accepted
    // In this case, items are automatically transferred, so manual "Give Item" is not needed
    if (tradeData.status === 'accepted') {
      const isOfferOwner = session.user.id === tradeData.offer.traveler.id
      const isProposer = session.user.id === tradeData.proposer.id
      
      // If this is an accepted trade with inventory items, the transfer is automatic
      if ((isOfferOwner && tradeData.offer.item) || 
          (isProposer && tradeData.offeredItem)) {
        return true // Hide "Give Item" button - transfer was automatic
      }
    }
    
    // Check for manual transfer system messages (legacy behavior)
    if (!messages.length) return false
    const userName = session.user.name?.split(' ')[0] || 'Someone'
    return messages.some(message => 
      !message.senderId && // System message
      message.content.includes(`${userName} has given you`) &&
      message.content.includes('You can now see this item in your inventory')
    )
  }

  // Update itemAlreadyGiven state when messages change or trade status updates
  useEffect(() => {
    setItemAlreadyGiven(checkIfItemAlreadyGiven())
  }, [messages, session?.user?.id, tradeData])

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

    // Validation will be handled on the server side

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
      } else {
        const errorData = await response.json()
        setMessageError(errorData.error || 'Failed to send message')
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
    if (isAccepted) {
      // For cancel action, use browser confirm as before
      if (!confirm('Are you sure you want to cancel this trade?')) return
      
      const newStatus = 'pending'
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
    } else {
      // For accept action, show custom modal
      setShowAcceptConfirmModal(true)
    }
  }

  const confirmAcceptTrade = async () => {
    if (!tradeData) return
    
    setShowAcceptConfirmModal(false)
    setAccepting(true)
    
    try {
      const response = await fetch(`/api/proposed-trades/${tradeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' })
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


  const handleSmartGiveItem = async () => {
    if (!otherUser || !tradeData) return
    
    setGivingItem(true)
    try {
      // Capture current location before transferring the item
      console.log('🗺️ Refreshing location for item transfer...')
      await refreshLocation()
      
      // Get the fresh location data after refresh
      const currentLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        city: location.city,
        country: location.country
      }
      // Determine what item should be given based on trade context
      let itemToGive = null
      let itemName = ""
      let itemDescription = ""
      let itemImageUrl = ""
      let isInventoryItem = false
      
      // If current user is the offer owner and it's their inventory item
      if (session?.user?.id === tradeData.offer.traveler.id && tradeData.offer.item) {
        itemToGive = tradeData.offer.item
        itemName = tradeData.offer.item.name
        isInventoryItem = true
      }
      // If current user is the proposer and it's their inventory item
      else if (session?.user?.id === tradeData.proposer.id && tradeData.offeredItem) {
        itemToGive = tradeData.offeredItem
        itemName = tradeData.offeredItem.name
        isInventoryItem = true
      }
      // If current user is the offer owner and it's a new item offer
      else if (session?.user?.id === tradeData.offer.traveler.id && tradeData.offer.item) {
        itemName = tradeData.offer.item.name
        itemDescription = ""
        itemImageUrl = tradeData.offer.item.imageUrl || ""
        isInventoryItem = false
      }
      // If current user is the proposer and it's their offered item for an ask
      else if (session?.user?.id === tradeData.proposer.id && tradeData.offeredItem) {
        itemName = tradeData.offeredItem.name
        itemDescription = ""
        itemImageUrl = tradeData.offeredItem.imageUrl || ""
        isInventoryItem = false
      }
      
      if (!itemName) {
        alert('No item found for this trade context')
        return
      }

      // Prepare request body based on whether it's an inventory item or new item
      const requestBody: any = {
        recipientId: otherUser.id,
        offerId: offerId,
        tradeId: tradeId,
        // Include current location data for real-time transfer location
        currentLocation: currentLocation
      }

      if (isInventoryItem && itemToGive) {
        requestBody.itemId = itemToGive.id
      } else {
        requestBody.itemName = itemName
        requestBody.itemDescription = itemDescription
        requestBody.itemImageUrl = itemImageUrl
      }

      const response = await fetch('/api/items/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        // Refresh messages to show the system message
        const messagesResponse = await fetch(`/api/messages/${offerId}/${tradeId}`)
        if (messagesResponse.ok) {
          const data = await messagesResponse.json()
          setMessages(data.messages || [])
        }
        // Item has been given, update state
        setItemAlreadyGiven(true)
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

  const handleGiveInventoryItem = async (item: any) => {
    if (!otherUser) return
    
    setGivingItem(true)
    try {
      // Capture current location before transferring the item
      console.log('🗺️ Refreshing location for inventory item transfer...')
      await refreshLocation()
      
      // Get the fresh location data after refresh
      const currentLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        city: location.city,
        country: location.country
      }

      const response = await fetch('/api/items/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: otherUser.id,
          itemId: item.id,
          offerId: offerId,
          tradeId: tradeId,
          // Include current location data for real-time transfer location
          currentLocation: currentLocation
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
                   tradeData.offer.item?.name || 
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
          <Link href={`/offers/${offerId}?from=${encodeURIComponent(`conversation-${offerId}-${tradeId}`)}`} className="flex items-center justify-center flex-1 -ml-12">
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
                <span className="font-normal">{session?.user?.id === tradeData.proposer.id ? 'You' : formatDisplayName(tradeData.proposer.firstName, tradeData.proposer.lastName)}</span> {session?.user?.id === tradeData.proposer.id ? 'offer' : 'offers'} <span className="italic">{tradeData.offeredItem?.name}</span>
              </p>
            </div>
            {/* Accept trade button (only for offer owner and if offer not deleted) - moved inline */}
            {session?.user?.id === tradeData.offer.traveler.id && tradeData.offer.status !== 'deleted' && (
              <div className="ml-2 flex-shrink-0">
                {/* Show accept/cancel button based on trade status */}
                {tradeData.status === 'accepted' ? (
                  existingReview ? (
                    <div className="bg-gray/10 text-gray border border-gray/20 px-3 py-1 rounded-sm text-xs cursor-not-allowed">
                      Item traded
                    </div>
                  ) : (
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
                  )
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
              // If system message has a specific recipient, only show to that user
              if (message.recipientId && message.recipientId !== session?.user?.id) {
                return null // Don't show this message to other users
              }
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
                    <div className="text-center text-gray text-sm">
                      {formatSystemMessage(message.content).includes('[SEND_ITEM_BUTTON]') ? (
                        <div>
                          {formatSystemMessage(message.content).split('[SEND_ITEM_BUTTON]').map((part, index, array) => (
                            <span key={index}>
                              {part}
                              {index < array.length - 1 && (
                                <>
                                  <Image 
                                    src="/images/brownhat_final.png" 
                                    alt="Send item" 
                                    width={16} 
                                    height={16} 
                                    className="inline mx-1" 
                                  />
                                  <span className="font-medium">Send item</span>
                                </>
                              )}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p>{formatSystemMessage(message.content)}</p>
                      )}
                    </div>
                    
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
                              revieweeName={formatDisplayName(otherUser.firstName, otherUser.lastName)}
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
                  setNewMessage(e.target.value)
                  setMessageError("")
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                placeholder={`Write a message to ${formatDisplayName(otherUser.firstName, otherUser.lastName)}`}
                className="w-full p-3 border border-black rounded-sm resize-none h-20 text-body bg-tan placeholder-gray focus:outline-none focus:ring-1 focus:ring-black"
              />
              {messageError && (
                <div className="text-red-600 text-xs">{messageError}</div>
              )}
            </div>
            <div className="flex justify-between mt-3">
              {!itemAlreadyGiven ? (
                <div className="flex flex-col">
                  {tradeData.status === 'accepted' ? (
                    existingReview ? (
                      <div className="bg-gray/20 text-gray border border-gray/30 px-2.5 py-1 rounded-sm flex items-center text-xs font-medium cursor-not-allowed">
                        <Image 
                          src="/images/brownhat_final.png" 
                          alt="Item sent" 
                          width={16} 
                          height={16} 
                          className="mr-2 opacity-50" 
                        />
                        Item sent
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowTradeReviewModal(true)}
                        disabled={givingItem}
                        className="bg-tan text-black border border-black px-2.5 py-1 rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-xs font-medium shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px]"
                      >
                        <Image 
                          src="/images/brownhat_final.png" 
                          alt="Send item" 
                          width={16} 
                          height={16} 
                          className="mr-2" 
                        />
                        Send item
                      </button>
                    )
                  ) : (
                    <div className="bg-gray/20 text-gray border border-gray/30 px-2.5 py-1 rounded-sm flex items-center text-xs font-medium cursor-not-allowed">
                      <Image 
                        src="/images/brownhat_final.png" 
                        alt="Trade not accepted" 
                        width={16} 
                        height={16} 
                        className="mr-2 opacity-50" 
                      />
                      Trade must be accepted first
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray/20 text-gray border border-gray/30 px-2.5 py-1 rounded-sm flex items-center text-xs font-medium cursor-not-allowed">
                  <Image 
                    src="/images/brownhat_final.png" 
                    alt="Item Given" 
                    width={16} 
                    height={16} 
                    className="mr-2 opacity-50" 
                  />
                  Item given
                </div>
              )}
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                className="bg-tan text-black border border-black px-2.5 py-1 rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-xs font-medium shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px]"
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

        {/* Trade Review Modal */}
        {showTradeReviewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-tan border-2 border-black rounded-sm p-6 max-w-sm w-full relative">
              {/* X Button */}
              <button
                onClick={() => setShowTradeReviewModal(false)}
                className="absolute top-4 right-4 text-black hover:text-gray transition-colors"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-lg font-normal mb-4 text-center">Rate Your Trade</h3>
              
              <div className="mb-4">
                <ReviewForm
                  proposedTradeId={tradeId}
                  revieweeName={formatDisplayName(otherUser.firstName, otherUser.lastName)}
                  existingReview={existingReview || undefined}
                  onSubmit={() => {
                    setShowTradeReviewModal(false)
                    // Refresh messages to show any updates
                    setTimeout(async () => {
                      const messagesResponse = await fetch(`/api/messages/${offerId}/${tradeId}`)
                      if (messagesResponse.ok) {
                        const data = await messagesResponse.json()
                        setMessages(data.messages || [])
                        // Scroll to bottom
                        setTimeout(() => {
                          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
                        }, 100)
                      }
                    }, 500)
                  }}
                  inline={true}
                  buttonText="Send item"
                />
                <p className="text-xs text-gray mt-3 text-center">
                  After both parties submit a review, a trade of items will be made. Check the inventory tab for your new item!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Custom Accept Confirmation Modal */}
        {showAcceptConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-tan border-2 border-black rounded-sm p-6 max-w-sm w-full">
              <h3 className="text-lg font-normal mb-4 text-center">
                Accept Trade?
              </h3>
              <p className="text-sm text-gray mb-6 text-center">
                Are you sure you want to accept this trade?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAcceptConfirmModal(false)}
                  className="flex-1 px-4 py-2 bg-tan text-black border border-black rounded-sm text-sm hover:bg-gray/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAcceptTrade}
                  className="flex-1 px-4 py-2 bg-tan text-black border border-black rounded-sm text-sm shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Accept
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

      </div>
    </AuthLayout>
  )
}