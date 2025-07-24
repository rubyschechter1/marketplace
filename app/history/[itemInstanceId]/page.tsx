"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import AuthLayout from "@/components/AuthLayout"
import Link from "next/link"
import { ArrowLeft, MapPin, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import BrownHatLoader from "@/components/BrownHatLoader"
import Image from "next/image"

interface HistoryEntry {
  id: string
  transferDate: string
  city: string | null
  country: string | null
  transferMethod: string
  fromOwner?: {
    id: string
    firstName: string
    lastName: string
  } | null
  toOwner?: {
    id: string
    firstName: string
    lastName: string
  } | null
  trade?: {
    id: string
    status: string
  } | null
}

interface ItemInstance {
  id: string
  serialNumber: string | null
  acquisitionMethod: string
  createdAt: string
  catalogItem: {
    id: string
    name: string
    description: string | null
    imageUrl: string | null
    category: string | null
    condition: string | null
  }
  currentOwner?: {
    id: string
    firstName: string
    lastName: string
  } | null
  originalOwner?: {
    id: string
    firstName: string
    lastName: string
  } | null
  history: HistoryEntry[]
}

export default function ItemHistoryPage({ params }: { params: Promise<{ itemInstanceId: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [itemInstance, setItemInstance] = useState<ItemInstance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [itemInstanceId, setItemInstanceId] = useState<string>("")

  useEffect(() => {
    params.then(p => setItemInstanceId(p.itemInstanceId))
  }, [params])

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push('/')
      return
    }

    async function fetchItemHistory() {
      if (!itemInstanceId) return
      
      try {
        const response = await fetch(`/api/history/${itemInstanceId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch item history')
        }
        const data = await response.json()
        setItemInstance(data.itemInstance)
      } catch (error) {
        console.error('Error fetching item history:', error)
        setError('Failed to load item history')
      } finally {
        setLoading(false)
      }
    }

    fetchItemHistory()
  }, [itemInstanceId, status, router])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getLocationString = (entry: HistoryEntry) => {
    if (entry.city && entry.country) {
      return `${entry.city}, ${entry.country}`
    }
    return "Unknown location"
  }

  const getTransferDescription = (entry: HistoryEntry) => {
    switch (entry.transferMethod) {
      case 'created':
        return 'Item created'
      case 'traded':
        return 'Traded'
      case 'imported':
        return 'Added to system'
      default:
        return 'Transferred'
    }
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="max-w-md mx-auto p-6 h-screen flex items-center justify-center">
          <BrownHatLoader size="large" text="Loading item history..." />
        </div>
      </AuthLayout>
    )
  }

  if (error || !itemInstance) {
    return (
      <AuthLayout>
        <div className="max-w-md mx-auto p-6">
          <div className="text-center">
            <h1 className="text-header font-normal mb-4">Item History</h1>
            <p className="text-body text-gray mb-6">{error || "Item not found"}</p>
            <Link 
              href="/"
              className="bg-tan text-black border border-black px-4 py-2 rounded-sm hover:bg-black hover:text-tan transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="max-w-md mx-auto p-6">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button 
            onClick={() => router.back()}
            className="mr-4"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-header font-normal">Item History</h1>
        </div>

        {/* Item Details */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            {itemInstance.catalogItem.imageUrl ? (
              <Image
                src={itemInstance.catalogItem.imageUrl}
                alt={itemInstance.catalogItem.name}
                width={80}
                height={80}
                className="rounded-sm object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-200 rounded-sm flex items-center justify-center">
                <span className="text-gray-400 text-xs">No image</span>
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-normal mb-2">{itemInstance.catalogItem.name}</h2>
              {itemInstance.catalogItem.description && (
                <p className="text-body text-gray mb-2">{itemInstance.catalogItem.description}</p>
              )}
              <div className="text-sm text-gray">
                {itemInstance.catalogItem.category && (
                  <span className="bg-tan px-2 py-1 rounded-sm border border-black mr-2">
                    {itemInstance.catalogItem.category}
                  </span>
                )}
                {itemInstance.catalogItem.condition && (
                  <span className="bg-tan px-2 py-1 rounded-sm border border-black">
                    {itemInstance.catalogItem.condition}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* History Timeline */}
        <div>
          <h3 className="text-body font-normal mb-4">Journey</h3>
          
          {itemInstance.history.length === 0 ? (
            <div className="text-center py-8 border border-black rounded-sm bg-tan">
              <p className="text-gray">No history available for this item</p>
            </div>
          ) : (
            <div className="space-y-4">
              {itemInstance.history.map((entry, index) => (
                <div
                  key={entry.id}
                  className="border border-black rounded-sm p-4 bg-white hover:shadow-[2px_2px_0px_#000000] transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-normal text-body mb-1">
                        {getTransferDescription(entry)}
                      </div>
                      <div className="flex items-center text-sm text-gray mb-2">
                        <Calendar size={12} className="mr-1" />
                        {formatDate(entry.transferDate)}
                      </div>
                      <div className="flex items-center text-sm text-gray">
                        <MapPin size={12} className="mr-1" />
                        {getLocationString(entry)}
                      </div>
                    </div>
                    
                    {/* Show step number */}
                    <div className="bg-tan border border-black rounded-full w-8 h-8 flex items-center justify-center text-sm font-normal">
                      {itemInstance.history.length - index}
                    </div>
                  </div>
                  
                  {/* Show owner information if available and relevant to current user */}
                  {(entry.fromOwner || entry.toOwner) && (
                    <div className="text-sm text-gray mt-3 pt-3 border-t border-gray/20">
                      {entry.fromOwner && (
                        <div>From: {entry.fromOwner.firstName} {entry.fromOwner.lastName}</div>
                      )}
                      {entry.toOwner && (
                        <div>To: {entry.toOwner.firstName} {entry.toOwner.lastName}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer info */}
        <div className="mt-8 text-center text-sm text-gray">
          <p>This item has traveled through {itemInstance.history.length} {itemInstance.history.length === 1 ? 'location' : 'locations'}</p>
          {itemInstance.serialNumber && (
            <p className="mt-1">Serial: {itemInstance.serialNumber}</p>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}