"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import AuthLayout from "@/components/AuthLayout"
import { useUser } from "@/contexts/UserContext"
import BrownHatLoader from "@/components/BrownHatLoader"
import { formatDisplayName } from "@/lib/formatName"
import ConversationSkeleton from "@/components/ConversationSkeleton"
import { X, ChevronDown, ChevronUp } from "lucide-react"

interface Conversation {
  id: string
  offerId: string
  senderId: string
  recipientId: string
  proposedTradeId: string | null
  content: string
  createdAt: string
  isRead: boolean
  unreadCount?: number
  isArchivedByMe?: boolean
  isArchivedByOther?: boolean
  isClosedForMessaging?: boolean
  sender: {
    id: string
    firstName: string
    lastName: string
  }
  recipient: {
    id: string
    firstName: string
    lastName: string
  }
  offer: {
    id: string
    title: string
    type?: string
    traveler: {
      id: string
      firstName: string
      lastName: string
    }
    item?: {
      name: string
      imageUrl?: string | null
    }
  }
  proposedTrade?: {
    id: string
    offeredItem?: {
      id: string
      name: string
      imageUrl?: string | null
    }
  }
}

export default function MessagesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { refreshUser } = useUser()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [swipedConversationId, setSwipedConversationId] = useState<string | null>(null)
  const [hoveredConversationId, setHoveredConversationId] = useState<string | null>(null)
  const [archivingConversationId, setArchivingConversationId] = useState<string | null>(null)
  const [showArchivedSection, setShowArchivedSection] = useState(false)
  const [showArchiveConfirmModal, setShowArchiveConfirmModal] = useState(false)
  const [conversationToArchive, setConversationToArchive] = useState<Conversation | null>(null)

  // Filter conversations
  const activeConversations = conversations.filter(c => !c.isArchivedByMe)
  const archivedConversations = conversations.filter(c => c.isArchivedByMe)

  // Format system messages for preview text
  const formatSystemMessagePreview = (content: string): string => {
    if (content.startsWith('TRADE_ACCEPTED:')) {
      const [, actorId, actorName] = content.split(':')
      const displayName = session?.user?.id === actorId ? 'You' : actorName
      return `${displayName} accepted the trade`
    }
    
    if (content.startsWith('TRADE_CANCELED:')) {
      const [, actorId, actorName] = content.split(':')
      const displayName = session?.user?.id === actorId ? 'You' : actorName
      return `${displayName} canceled the trade`
    }
    
    if (content.startsWith('GIFT_MODE_SETTER:')) {
      return `You set the offer to gift mode`
    }
    
    if (content.startsWith('GIFT_MODE_OTHER:')) {
      const [, actorId, actorName] = content.split(':')
      return `${actorName} set the offer to gift mode`
    }
    
    if (content.startsWith('GIFT_MODE_ENABLED:')) {
      const [, actorId, actorName] = content.split(':')
      const displayName = session?.user?.id === actorId ? 'You' : actorName
      return `${displayName} set this to gift mode`
    }
    
    if (content === 'Trade rejected') {
      return 'Trade was rejected'
    }
    
    if (content === 'Trade withdrawn') {
      return 'Trade was withdrawn'
    }
    
    if (content.includes('Trade completed! Both parties have reviewed each other')) {
      return 'Trade completed'
    }
    
    if (content.includes('Gift completed! Both parties have reviewed each other')) {
      return 'Gift completed'
    }
    
    if (content.includes('This item is no longer available - another trade was accepted')) {
      return 'Item no longer available'
    }
    
    if (content.includes('This item is available again - the previous trade was cancelled')) {
      return 'Item available again'
    }
    
    // Return original content for non-system messages or unrecognized system messages
    return content
  }

  console.log('MessagesPage render - loading:', loading, 'status:', status, 'conversations:', conversations.length)

  useEffect(() => {
    console.log('MessagesPage useEffect - status:', status, 'loading:', loading)
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push('/')
      return
    }

    const abortController = new AbortController()

    async function fetchConversations() {
      console.log('fetchConversations started')
      try {
        const response = await fetch('/api/messages/conversations', {
          signal: abortController.signal
        })
        console.log('fetchConversations response status:', response.status)
        if (response.ok) {
          const data = await response.json()
          setConversations(data.conversations || [])
          setLoading(false)
        } else {
          setLoading(false)
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching conversations:', error)
          setLoading(false)
        } else {
          console.log('Fetch was aborted, not changing loading state')
        }
      }
    }

    fetchConversations()
    refreshUser() // Update unread count when viewing messages

    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      fetchConversations()
    }, 5000)

    return () => {
      abortController.abort()
      clearInterval(interval)
    }
  }, [status, router])

  const handleConversationClick = (message: Conversation) => {
    console.log('handleConversationClick called with message:', message)
    console.log('proposedTradeId:', message.proposedTradeId)
    console.log('offerId:', message.offerId)
    
    if (message.proposedTradeId) {
      const conversationUrl = `/messages/${message.offerId}/${message.proposedTradeId}`
      console.log('Navigating to conversation:', conversationUrl)
      router.push(conversationUrl)
    } else {
      console.log('No proposedTradeId, falling back to offer page:', `/offers/${message.offerId}`)
      // Fallback to offer page if no proposed trade
      router.push(`/offers/${message.offerId}`)
    }
  }

  const handleRefresh = async () => {
    if (refreshing) return // Prevent multiple simultaneous refreshes
    
    setRefreshing(true)
    try {
      const response = await fetch('/api/messages/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
        refreshUser() // Update unread count
      }
    } catch (error) {
      console.error('Error refreshing conversations:', error)
    } finally {
      // Add a small delay to show the refresh indicator
      setTimeout(() => {
        setRefreshing(false)
      }, 500)
    }
  }

  const handleArchiveClick = (conversation: Conversation) => {
    setConversationToArchive(conversation)
    setShowArchiveConfirmModal(true)
  }

  const handleArchiveConversation = async () => {
    if (!conversationToArchive) return
    
    setArchivingConversationId(conversationToArchive.id)
    setShowArchiveConfirmModal(false)
    
    try {
      const response = await fetch('/api/messages/conversations/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: conversationToArchive.offerId,
          proposedTradeId: conversationToArchive.proposedTradeId
        })
      })

      if (response.ok) {
        // Update local state
        setConversations(prevConversations => 
          prevConversations.map(c => 
            c.id === conversationToArchive.id 
              ? { ...c, isArchivedByMe: true, isClosedForMessaging: true }
              : c
          )
        )
        refreshUser() // Update unread count
      }
    } catch (error) {
      console.error('Error archiving conversation:', error)
    } finally {
      setArchivingConversationId(null)
      setSwipedConversationId(null)
      setConversationToArchive(null)
    }
  }

  // Swipe handlers for mobile
  const handleSwipeStart = (e: React.TouchEvent, conversationId: string) => {
    const touch = e.touches[0]
    const startX = touch.clientX
    
    const handleSwipeMove = (moveEvent: TouchEvent) => {
      const moveTouch = moveEvent.touches[0]
      const deltaX = startX - moveTouch.clientX
      
      // Swipe left to reveal archive button
      if (deltaX > 50) {
        setSwipedConversationId(conversationId)
      } else if (deltaX < -50) {
        setSwipedConversationId(null)
      }
    }
    
    const handleSwipeEnd = () => {
      document.removeEventListener('touchmove', handleSwipeMove)
      document.removeEventListener('touchend', handleSwipeEnd)
    }
    
    document.addEventListener('touchmove', handleSwipeMove)
    document.addEventListener('touchend', handleSwipeEnd)
  }

  if (loading || status === "loading") {
    return (
      <AuthLayout>
        <main className="p-4 max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">Messages</h1>
          <div className="space-y-3">
            <ConversationSkeleton />
            <ConversationSkeleton />
            <ConversationSkeleton />
          </div>
        </main>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <main className="p-4 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Messages</h1>

        {/* Pull to refresh indicator */}
        {refreshing && (
          <div className="flex justify-center mb-4">
            <BrownHatLoader size="small" text="Refreshing..." />
          </div>
        )}

        {activeConversations.length === 0 && archivedConversations.length === 0 ? (
          <div 
            className="text-center py-12"
            onTouchStart={(e) => {
              const touch = e.touches[0]
              let startY = touch.clientY
              let scrollTop = 0
              
              const handleTouchMove = (moveEvent: TouchEvent) => {
                const moveTouch = moveEvent.touches[0]
                const deltaY = moveTouch.clientY - startY
                
                // Check if we're at the top and pulling down
                if (scrollTop <= 0 && deltaY > 80 && !refreshing) {
                  handleRefresh()
                  document.removeEventListener('touchmove', handleTouchMove)
                  document.removeEventListener('touchend', handleTouchEnd)
                }
              }
              
              const handleTouchEnd = () => {
                document.removeEventListener('touchmove', handleTouchMove)
                document.removeEventListener('touchend', handleTouchEnd)
              }
              
              // Get scroll position
              scrollTop = window.pageYOffset || document.documentElement.scrollTop
              
              document.addEventListener('touchmove', handleTouchMove)
              document.addEventListener('touchend', handleTouchEnd)
            }}
          >
            <p className="text-gray-500 mb-4">No conversations yet</p>
            <p className="text-sm text-gray-400">
              Start a conversation by browsing offers
            </p>
          </div>
        ) : (
          <div 
            className="space-y-3"
            onTouchStart={(e) => {
              const touch = e.touches[0]
              let startY = touch.clientY
              let scrollTop = 0
              
              const handleTouchMove = (moveEvent: TouchEvent) => {
                const moveTouch = moveEvent.touches[0]
                const deltaY = moveTouch.clientY - startY
                
                // Check if we're at the top and pulling down
                if (scrollTop <= 0 && deltaY > 80 && !refreshing) {
                  handleRefresh()
                  document.removeEventListener('touchmove', handleTouchMove)
                  document.removeEventListener('touchend', handleTouchEnd)
                }
              }
              
              const handleTouchEnd = () => {
                document.removeEventListener('touchmove', handleTouchMove)
                document.removeEventListener('touchend', handleTouchEnd)
              }
              
              // Get scroll position
              scrollTop = window.pageYOffset || document.documentElement.scrollTop
              
              document.addEventListener('touchmove', handleTouchMove)
              document.addEventListener('touchend', handleTouchEnd)
            }}
          >
            {activeConversations.map((message) => {
              const otherUser = message.senderId === session?.user?.id 
                ? message.recipient 
                : message.sender
              
              // Determine the context for clearer labeling
              const isAsk = message.offer?.type === 'ask'
              const itemName = message.offer?.item?.name || 
                               message.offer?.title
              const isMyOffer = message.offer?.traveler?.id === session?.user?.id
              
              // Create context-aware title based on ownership
              let contextTitle = itemName
              if (isAsk) {
                if (isMyOffer) {
                  contextTitle = `Your ask: ${itemName}`
                } else {
                  contextTitle = `${formatDisplayName(message.offer?.traveler?.firstName || '', message.offer?.traveler?.lastName)} is asking for: ${itemName}`
                }
              } else {
                if (isMyOffer) {
                  contextTitle = `Your offer: ${itemName}`
                } else {
                  contextTitle = `${formatDisplayName(message.offer?.traveler?.firstName || '', message.offer?.traveler?.lastName)} is offering: ${itemName}`
                }
              }
              
              return (
                <div
                  key={message.id}
                  className="relative"
                  onTouchStart={(e) => handleSwipeStart(e, message.id)}
                >
                  {/* Swipe archive button for mobile */}
                  {swipedConversationId === message.id && (
                    <div className="absolute inset-0 flex items-center justify-end pr-4 bg-red-500 rounded-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleArchiveClick(message)
                        }}
                        className="text-white font-medium"
                      >
                        Archive
                      </button>
                    </div>
                  )}
                  
                  <div 
                    className={`flex items-start gap-3 transition-transform ${
                      swipedConversationId === message.id ? '-translate-x-24' : ''
                    }`}
                    onClick={() => {
                      if (swipedConversationId === message.id) {
                        setSwipedConversationId(null)
                      } else {
                        handleConversationClick(message)
                      }
                    }}
                  >
                  {/* Show offer item image for regular offers, or proposed item image for asks */}
                  {(message.offer?.item?.imageUrl || 
                    message.proposedTrade?.offeredItem?.imageUrl) ? (
                    <img
                      src={message.offer?.item?.imageUrl || 
                           message.proposedTrade?.offeredItem?.imageUrl || ''}
                      alt={message.offer?.item?.name || 
                           message.proposedTrade?.offeredItem?.name || 'Item'}
                      className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-tan border border-black rounded-md flex-shrink-0 flex items-center justify-center">
                      {message.offer?.type === 'ask' ? (
                        <span className="text-xs font-normal text-black">Ask</span>
                      ) : (
                        <span className="text-xs font-normal text-black">Item</span>
                      )}
                    </div>
                  )}
                  <div 
                    className={`flex-1 bg-tan border ${message.unreadCount && message.unreadCount > 0 ? 'border-2 border-black' : 'border-black'} rounded-sm p-4 transition-all cursor-pointer relative shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px] group`}
                    onMouseEnter={() => setHoveredConversationId(message.id)}
                    onMouseLeave={() => setHoveredConversationId(null)}
                  >
                    {/* Desktop X button */}
                    {hoveredConversationId === message.id && !message.isClosedForMessaging && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleArchiveClick(message)
                        }}
                        className="absolute top-2 right-2 p-1 hover:bg-black hover:text-tan rounded-sm transition-colors block z-10"
                        disabled={archivingConversationId === message.id}
                      >
                        <X size={16} />
                      </button>
                    )}
                    
                    <div className="flex items-center">
                      <div className="flex-1">
                        <h3 className="text-body font-normal mb-1">
                          {contextTitle}
                        </h3>
                        <p className="text-sm italic text-gray">
                          {message.senderId ? (
                            <>
                              <span className="font-medium not-italic">
                                {message.senderId === session?.user?.id ? 'You' : formatDisplayName(message.sender?.firstName || 'Unknown', message.sender?.lastName)}:
                              </span>{' '}
                            </>
                          ) : ''}
                          {formatSystemMessagePreview(message.content)}
                        </p>
                      </div>
                      {message.unreadCount != null && message.unreadCount > 0 && (
                        <div className="bg-black rounded-full h-3 w-3 ml-4"></div>
                      )}
                    </div>
                    {/* Closed indicator */}
                    {message.isClosedForMessaging && !message.isArchivedByMe && (
                      <div className="text-xs text-gray mt-2">
                        Conversation closed
                      </div>
                    )}
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        )}

        {/* Archived Conversations Section */}
        {archivedConversations.length > 0 && (
          <div className="mt-8">
            <button
              onClick={() => setShowArchivedSection(!showArchivedSection)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-3"
            >
              {showArchivedSection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              Archived conversations ({archivedConversations.length})
            </button>
            
            {showArchivedSection && (
              <div className="space-y-3">
                {archivedConversations.map((message) => {
                  const otherUser = message.senderId === session?.user?.id 
                    ? message.recipient 
                    : message.sender
                  
                  const isAsk = message.offer?.type === 'ask'
                  const itemName = message.offer?.item?.name || 
                                   message.offer?.title
                  const isMyOffer = message.offer?.traveler?.id === session?.user?.id
                  
                  let contextTitle = itemName
                  if (isAsk) {
                    if (isMyOffer) {
                      contextTitle = `Your ask: ${itemName}`
                    } else {
                      contextTitle = `${formatDisplayName(message.offer?.traveler?.firstName || '', message.offer?.traveler?.lastName)} is asking for: ${itemName}`
                    }
                  } else {
                    if (isMyOffer) {
                      contextTitle = `Your offer: ${itemName}`
                    } else {
                      contextTitle = `${formatDisplayName(message.offer?.traveler?.firstName || '', message.offer?.traveler?.lastName)} is offering: ${itemName}`
                    }
                  }
                  
                  return (
                    <div
                      key={message.id}
                      className="relative opacity-60"
                      onClick={() => handleConversationClick(message)}
                    >
                      <div className="flex items-start gap-3">
                        {(message.offer?.item?.imageUrl || 
                          message.proposedTrade?.offeredItem?.imageUrl) ? (
                          <img
                            src={message.offer?.item?.imageUrl || 
                                 message.proposedTrade?.offeredItem?.imageUrl || ''}
                            alt={message.offer?.item?.name || 
                                 message.proposedTrade?.offeredItem?.name || 'Item'}
                            className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-tan border border-black rounded-md flex-shrink-0 flex items-center justify-center">
                            {message.offer?.type === 'ask' ? (
                              <span className="text-xs font-normal text-black">Ask</span>
                            ) : (
                              <span className="text-xs font-normal text-black">Item</span>
                            )}
                          </div>
                        )}
                        <div className="flex-1 bg-tan border border-black rounded-sm p-4 cursor-pointer shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                          <div className="flex items-center">
                            <div className="flex-1">
                              <h3 className="text-body font-normal mb-1">
                                {contextTitle}
                              </h3>
                              <div className="text-sm italic text-gray">
                                <div className="flex">
                                  {message.senderId && (
                                    <span className="font-medium not-italic w-16 flex-shrink-0 truncate">
                                      {message.senderId === session?.user?.id ? 'You' : formatDisplayName(message.sender?.firstName || 'Unknown', message.sender?.lastName)}:
                                    </span>
                                  )}
                                  <span className={message.senderId ? 'ml-1 flex-1' : 'flex-1'}>
                                    {formatSystemMessagePreview(message.content)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray mt-2">
                            Archived conversation
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Archive Confirmation Modal */}
      {showArchiveConfirmModal && conversationToArchive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-tan border-2 border-black rounded-sm p-6 max-w-sm w-full shadow-[8px_8px_0px_#000000]">
            <h3 className="text-xl font-bold mb-4">Archive Conversation?</h3>
            <p className="mb-6 text-gray-700">
              This will archive the conversation and close it for both parties. 
              No new messages can be sent once archived.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleArchiveConversation}
                className="flex-1 bg-black text-tan px-4 py-2 rounded-sm hover:bg-gray-800 transition-colors"
                disabled={archivingConversationId !== null}
              >
                {archivingConversationId !== null ? 'Archiving...' : 'Archive'}
              </button>
              <button
                onClick={() => {
                  setShowArchiveConfirmModal(false)
                  setConversationToArchive(null)
                }}
                className="flex-1 bg-tan border border-black px-4 py-2 rounded-sm hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}