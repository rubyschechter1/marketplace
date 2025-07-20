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
  status?: string
  proposer: {
    id: string
    firstName: string
    lastName: string
  }
  offeredItem: {
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
  const hasRefreshedUser = useRef(false)

  useEffect(() => {
    params.then(p => {
      setOfferId(p.offerId)
      setTradeId(p.tradeId)
      // Reset the ref when conversation changes
      hasRefreshedUser.current = false
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

        // Fetch messages for this specific trade
        const messagesResponse = await fetch(`/api/messages/${offerId}/${tradeId}`)
        if (messagesResponse.ok) {
          const data = await messagesResponse.json()
          setMessages(data.messages || [])
          
          // Refresh user context only once per conversation load
          if (!hasRefreshedUser.current) {
            hasRefreshedUser.current = true
            refreshUser()
          }
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

  if (loading || !tradeData) {
    return (
      <AuthLayout variant="fullHeight">
        <div className="max-w-md mx-auto p-6">
          <div className="py-12">
            <BrownHatLoader size="large" text="Loading conversation..." />
          </div>
        </div>
      </AuthLayout>
    )
  }

  const otherUser = session?.user?.id === tradeData.proposer.id 
    ? tradeData.offer.traveler 
    : tradeData.proposer

  const itemName = tradeData.offer.item?.name || tradeData.offer.title

  return (
    <AuthLayout variant="fullHeight">
      <div className="max-w-md mx-auto flex flex-col min-h-screen pb-16">
        {/* Header */}
        <div className="p-4 border-b border-gray/20 flex items-center">
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
          <Link href={`/offers/${offerId}`} className="flex items-center flex-1">
            {/* Show offer item image for regular offers, or proposed item image for asks */}
            {(tradeData.offer.item?.imageUrl || tradeData.offeredItem?.imageUrl) && (
              <img
                src={tradeData.offer.item?.imageUrl || tradeData.offeredItem?.imageUrl}
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

          {/* Accept trade button (only for offer owner and if offer not deleted) */}
          {session?.user?.id === tradeData.offer.traveler.id && tradeData.offer.status !== 'deleted' && (
            <div className="mb-4">
              <button 
                onClick={handleAcceptTrade}
                disabled={accepting}
                className="w-full bg-tan text-black border border-black p-3 rounded-sm hover:bg-black hover:text-tan transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {accepting ? (
                  <div className="flex items-center justify-center">
                    <BrownHatLoader size="small" />
                    <span className="ml-2">Updating...</span>
                  </div>
                ) : tradeData.status === 'accepted' ? 'cancel trade' : 'accept trade'}
              </button>
            </div>
          )}

          {/* Other messages */}
          {messages.map((message) => {
            const isOwnMessage = message.senderId === session?.user?.id
            const isSystemMessage = !message.senderId
            
            // System messages
            if (isSystemMessage) {
              return (
                <div key={message.id} className="mb-4">
                  <div className="bg-gray/10 rounded-sm p-3">
                    <p className="text-center text-gray text-sm">{message.content}</p>
                  </div>
                  <p className="text-center text-xs text-gray mt-1">
                    {new Date(message.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )
            }
            
            // Regular messages
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

        {/* Bottom section - either deleted message or input */}
        <div className="border-t border-gray/20">
          {tradeData.offer.status === 'deleted' ? (
            <div className="bg-gray/10 p-4">
              <p className="text-center text-gray text-sm">
                {tradeData.offer.type === 'ask' ? 'Ask' : 'Offer'} deleted
              </p>
            </div>
          ) : (
            <div className="p-4">
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
                {sending ? (
                  <>
                    <BrownHatLoader size="small" />
                    <span className="ml-2">Sending...</span>
                  </>
                ) : (
                  <>
                    Send
                    <Send size={16} className="ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}