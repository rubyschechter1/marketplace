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
    item?: {
      name: string
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
      router.push(`/messages/${message.offerId}/${message.proposedTradeId}`)
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
                  className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-gray-600">
                        {otherUser?.firstName?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {otherUser?.firstName ? `${otherUser.firstName} ${otherUser.lastName}` : 'Unknown User'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Re: {message.offer?.item?.name || message.offer?.title}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {message.createdAt ? new Date(message.createdAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 truncate">
                        {message.content}
                      </p>
                    </div>
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