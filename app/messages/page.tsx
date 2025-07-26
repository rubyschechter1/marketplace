"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import AuthLayout from "@/components/AuthLayout"
import { useUser } from "@/contexts/UserContext"
import BrownHatLoader from "@/components/BrownHatLoader"
import { formatDisplayName } from "@/lib/formatName"
import ConversationSkeleton from "@/components/ConversationSkeleton"

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
          console.log('fetchConversations data:', data)
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

    return () => {
      abortController.abort()
    }
  }, [status, router])

  const handleConversationClick = (message: Conversation) => {
    console.log('handleConversationClick called with message:', message)
    console.log('proposedTradeId:', message.proposedTradeId)
    console.log('offerId:', message.offerId)
    
    if (message.proposedTradeId) {
      const conversationUrl = `/messages/${message.offerId}/${message.proposedTradeId}?from=messages`
      console.log('Navigating to conversation:', conversationUrl)
      router.push(conversationUrl)
    } else {
      console.log('No proposedTradeId, falling back to offer page:', `/offers/${message.offerId}`)
      // Fallback to offer page if no proposed trade
      router.push(`/offers/${message.offerId}`)
    }
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

        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No conversations yet</p>
            <p className="text-sm text-gray-400">
              Start a conversation by browsing offers
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((message) => {
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
                  onClick={() => handleConversationClick(message)}
                  className="flex items-start gap-3"
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
                  <div className={`flex-1 bg-tan border ${message.unreadCount && message.unreadCount > 0 ? 'border-2 border-black' : 'border-black'} rounded-sm p-4 transition-all cursor-pointer relative shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px]`}>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-body font-normal mb-1">
                        {contextTitle}
                      </h3>
                      {message.unreadCount != null && message.unreadCount > 0 && (
                        <div className="bg-black text-white text-xs rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center font-medium flex-shrink-0">
                          {message.unreadCount}
                        </div>
                      )}
                    </div>
                    <p className="text-sm italic text-gray">
                      {message.senderId ? (
                        message.senderId === session?.user?.id ? 'You: ' : `${formatDisplayName(message.sender?.firstName || 'Unknown', message.sender?.lastName)}: `
                      ) : ''}{message.content}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </AuthLayout>
  )
}