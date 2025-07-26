"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import AuthLayout from "@/components/AuthLayout"
import Link from "next/link"
import { ArrowLeft, MapPin, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import BrownHatLoader from "@/components/BrownHatLoader"
import { getDisplayName } from "@/lib/formatName"

interface HistoryEntry {
  id: string
  transferDate: string
  city: string | null
  country: string | null
  transferMethod: string
  fromOwner: {
    id: string
    firstName: string
    lastName: string
  } | null
  toOwner: {
    id: string
    firstName: string
    lastName: string
  } | null
}

interface ItemInstance {
  id: string
  serialNumber: string | null
  acquisitionMethod: string
  isAvailable: boolean
  createdAt: string
  catalogItem: {
    id: string
    name: string
    description: string | null
    category: string | null
    condition: string | null
    imageUrl: string | null
  }
  history: HistoryEntry[]
}

export default function ItemHistoryPage({ params }: { params: Promise<{ itemInstanceId: string }> }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [itemInstance, setItemInstance] = useState<ItemInstance | null>(null)
  const [loading, setLoading] = useState(true)
  const [itemInstanceId, setItemInstanceId] = useState("")

  useEffect(() => {
    params.then(p => setItemInstanceId(p.itemInstanceId))
  }, [params])

  useEffect(() => {
    if (!itemInstanceId) return
    
    const fetchItemHistory = async () => {
      try {
        const response = await fetch(`/api/history/${itemInstanceId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch item history')
        }
        const data = await response.json()
        setItemInstance(data.itemInstance)
      } catch (error) {
        console.error('Error fetching item history:', error)
        router.push('/inventory')
      } finally {
        setLoading(false)
      }
    }

    fetchItemHistory()
  }, [itemInstanceId, router])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'numeric',
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
      case 'gifted':
        return 'Item was gifted'
      case 'traded':
        return 'Item was traded'
      case 'found':
        return 'Item was found'
      default:
        return 'Item changed hands'
    }
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center min-h-screen pb-16">
          <BrownHatLoader size="large" text="Loading item history..." />
        </div>
      </AuthLayout>
    )
  }

  if (!itemInstance) {
    return (
      <AuthLayout>
        <div className="max-w-md mx-auto p-6">
          <p className="text-center text-gray">Item not found</p>
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
          <div className="flex-1 flex justify-center -ml-8">
            <h1 className="text-header font-normal">{itemInstance.catalogItem.name}'s Journey</h1>
          </div>
        </div>

        {/* Item Details */}
        <div className="mb-10">
          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center">
              {itemInstance.catalogItem.imageUrl ? (
                <img
                  src={itemInstance.catalogItem.imageUrl}
                  alt={itemInstance.catalogItem.name}
                  className="w-36 h-36 rounded-sm object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-36 h-36 bg-gray/20 rounded-sm flex items-center justify-center flex-shrink-0">
                  <span className="text-gray text-xs">No image</span>
                </div>
              )}
              
              <button 
                onClick={() => {
                  const params = new URLSearchParams({
                    itemInstanceId: itemInstance.id,
                    itemName: itemInstance.catalogItem.name,
                    ...(itemInstance.catalogItem.description && { itemDescription: itemInstance.catalogItem.description }),
                    ...(itemInstance.catalogItem.imageUrl && { itemPhoto: itemInstance.catalogItem.imageUrl })
                  })
                  router.push(`/offers/new?${params.toString()}`)
                }}
                className="bg-tan text-black border border-black py-2.5 px-8 rounded-sm transition-all shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px] font-medium text-sm mt-4"
              >
                Offer item
              </button>
            </div>
            
            <div className="flex-1">
              {itemInstance.catalogItem.description && (
                <p className="text-body text-gray mb-4 leading-relaxed">{itemInstance.catalogItem.description}</p>
              )}
              
              <div className="text-sm text-gray mb-4">
                {itemInstance.catalogItem.category && (
                  <span className="bg-tan px-3 py-1.5 rounded-sm border border-black mr-2 text-xs">
                    {itemInstance.catalogItem.category}
                  </span>
                )}
                {itemInstance.catalogItem.condition && (
                  <span className="bg-tan px-3 py-1.5 rounded-sm border border-black text-xs">
                    {itemInstance.catalogItem.condition}
                  </span>
                )}
              </div>
              
              {/* Journey Timeline - moved here to the right of the image */}
              <div className="pt-0 px-6 pb-6">
                {itemInstance.history.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray">No history available for this item</p>
                  </div>
                ) : (
                  <div className="relative">
                    {itemInstance.history.map((entry, index) => {
                      const isLast = index === itemInstance.history.length - 1
                      return (
                        <div key={entry.id} className="relative flex items-center">
                          {/* Timeline dot */}
                          <div className="w-3 h-3 bg-black rounded-full flex-shrink-0 z-10"></div>
                          
                          {/* Dotted line connecting to next item */}
                          {!isLast && (
                            <div className="absolute left-1.5 top-6 w-px h-6 border-l-2 border-dotted border-black"></div>
                          )}
                          
                          {/* Content */}
                          <div className="ml-4 py-2">
                            <div className="text-body font-normal">
                              Traded in {getLocationString(entry)} on {formatDate(entry.transferDate)}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}