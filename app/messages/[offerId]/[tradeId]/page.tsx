"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import AuthLayout from "@/components/AuthLayout"
import ProfileThumbnail from "@/components/ProfileThumbnail"
import { ChevronLeft, Send } from "lucide-react"
import Link from "next/link"

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: string
  sender: {
    id: string
    firstName: string
    lastName: string
  }
}

interface TradeData {
  id: string
  proposer: {
    id: string
    firstName: string
    lastName: string
  }
  offeredItem: {
    id: string
    name: string
  }
  offer: {
    id: string
    title: string
    traveler: {
      id: string
      firstName: string
      lastName: string
    }
    item: {
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
  const [offerId, setOfferId] = useState<string>("")
  const [tradeId, setTradeId] = useState<string>("")
  const [fromPage, setFromPage] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [tradeData, setTradeData] = useState<TradeData | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    params.then(p => {
      setOfferId(p.offerId)
      setTradeId(p.tradeId)
    })
    searchParams.then(sp => {
      setFromPage(sp.from || 'home')
    })
  }, [params, searchParams])

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push('/')
      return
    }

    async function fetchData() {
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

        // Fetch messages for this offer
        const messagesResponse = await fetch(`/api/messages/offers/${offerId}`)
        if (messagesResponse.ok) {
          const data = await messagesResponse.json()
          setMessages(data.messages || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [offerId, tradeId, status, router])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !tradeData) return

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
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  if (loading || !tradeData) {
    return (
      <AuthLayout>
        <div className="max-w-md mx-auto p-6">
          <p>Loading...</p>
        </div>
      </AuthLayout>
    )
  }

  const otherUser = session?.user?.id === tradeData.proposer.id 
    ? tradeData.offer.traveler 
    : tradeData.proposer

  const itemName = tradeData.offer.item?.name || tradeData.offer.title

  return (
    <AuthLayout>
      <div className="max-w-md mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray/20 flex items-center">
          <button 
            onClick={() => {
              if (fromPage === 'messages') {
                router.push('/messages')
              } else if (fromPage === 'search') {
                router.push('/search')
              } else {
                router.push('/')
              }
            }}
            className="mr-3"
          >
            <ChevronLeft size={24} />
          </button>
          <Link href={`/offers/${offerId}`} className="flex items-center flex-1">
            {tradeData.offer.item?.imageUrl && (
              <img
                src={tradeData.offer.item.imageUrl}
                alt={itemName}
                className="w-10 h-10 object-cover rounded-sm mr-3"
              />
            )}
            <h1 className="text-header font-normal">{itemName}</h1>
          </Link>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Initial trade proposal message */}
          <div className="flex items-start mb-4">
            <ProfileThumbnail 
              user={tradeData.proposer} 
              size="sm" 
              className="mr-3" 
            />
            <div className="flex-1">
              <div className="bg-tan border border-black rounded-sm p-3">
                <p className="text-body">
                  <span className="font-normal">{tradeData.proposer.firstName} {tradeData.proposer.lastName}</span> is willing to trade <span className="italic">{tradeData.offeredItem.name}</span>
                </p>
              </div>
              <p className="text-xs text-gray mt-1">
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Accept trade button (only for offer owner) */}
          {session?.user?.id === tradeData.offer.traveler.id && (
            <div className="mb-4">
              <button className="w-full bg-tan text-black border border-black p-3 rounded-sm hover:bg-black hover:text-tan transition-colors">
                accept trade
              </button>
            </div>
          )}

          {/* Other messages */}
          {messages.map((message) => {
            const isOwnMessage = message.senderId === session?.user?.id
            return (
              <div key={message.id} className="flex items-start mb-4">
                <ProfileThumbnail 
                  user={message.sender} 
                  size="sm" 
                  className="mr-3" 
                />
                <div className="flex-1">
                  <div className="bg-tan border border-black rounded-sm p-3">
                    <p className="text-body">{message.content}</p>
                  </div>
                  <p className="text-xs text-gray mt-1">
                    {new Date(message.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Message input */}
        <div className="p-4 border-t border-gray/20">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder={`Write a message to ${otherUser.firstName}`}
            className="w-full p-3 border border-black rounded-sm resize-none h-20 mb-3 text-body bg-tan placeholder-gray focus:outline-none focus:ring-1 focus:ring-black"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              className="bg-tan text-black border border-black px-4 py-2 rounded-sm hover:bg-black hover:text-tan transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
            >
              {sending ? "Sending..." : "Send"}
              <Send size={16} className="ml-2" />
            </button>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}