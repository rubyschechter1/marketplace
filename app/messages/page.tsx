"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import AuthLayout from "@/components/AuthLayout"

interface Conversation {
  id: string
  offerId: string
  senderId: string
  recipientId: string
  proposedTradeId: string | null
  content: string
  createdAt: string
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
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push('/')
      return
    }

    async function fetchConversations() {
      try {
        const response = await fetch('/api/messages/conversations')
        if (response.ok) {
          const data = await response.json()
          setConversations(data.conversations || [])
        }
      } catch (error) {
        console.error('Error fetching conversations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [status, router])

  const handleConversationClick = (message: Conversation) => {
    if (message.proposedTradeId) {
      router.push(`/messages/${message.offerId}/${message.proposedTradeId}?from=messages`)
    } else {
      // Fallback to offer page if no proposed trade
      router.push(`/offers/${message.offerId}`)
    }
  }

  if (loading) {
    return (
      <AuthLayout>
        <main className="p-4 max-w-md mx-auto">
          <p>Loading...</p>
        </main>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <main className="p-4 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>

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
              
              return (
                <div
                  key={message.id}
                  onClick={() => handleConversationClick(message)}
                  className="flex items-center gap-3"
                >
                  {/* Show offer item image for regular offers, or proposed item image for asks */}
                  {(message.offer?.item?.imageUrl || message.proposedTrade?.offeredItem?.imageUrl) ? (
                    <img
                      src={message.offer?.item?.imageUrl || message.proposedTrade?.offeredItem?.imageUrl}
                      alt={message.offer?.item?.name || message.proposedTrade?.offeredItem?.name || 'Item'}
                      className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray/20 rounded-md flex-shrink-0" />
                  )}
                  <div className="flex-1 bg-tan border border-black rounded-sm p-4 hover:bg-tan/80 transition-colors cursor-pointer">
                    <h3 className="text-body font-normal mb-1">
                      {message.offer?.item?.name || message.offer?.title}
                    </h3>
                    <p className="text-sm italic text-gray">
                      {otherUser?.firstName || 'Unknown'}: {message.content}
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