"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import AuthLayout from "@/components/AuthLayout"
import Link from "next/link"
import { ChevronLeft, MapPin, Calendar } from "lucide-react"
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

  // Get the most recent history entry to show in header - only if current user is the recipient
  const mostRecentEntry = itemInstance.history.length > 0 ? itemInstance.history[itemInstance.history.length - 1] : null
  const shouldShowReceivedText = mostRecentEntry && session?.user?.id && mostRecentEntry.toOwner?.id === session.user.id

  return (
    <AuthLayout>
      <div className="max-w-md mx-auto bg-tan min-h-screen" style={{ padding: '16px 24px 24px 24px' }}>
        {/* Header */}
        <div className="flex items-center mb-6">
          <button 
            onClick={() => router.back()}
            className="mr-4"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1 flex justify-center -ml-8">
            <h1 className="text-2xl font-normal text-black">
              {itemInstance.catalogItem.name}'s Journey
            </h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6" style={{ paddingTop: '10px' }}>

          {/* Image and Content */}
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              {itemInstance.catalogItem.imageUrl ? (
                <img
                  src={itemInstance.catalogItem.imageUrl}
                  alt={itemInstance.catalogItem.name}
                  className="w-48 h-48 rounded-sm object-cover"
                />
              ) : (
                <div className="w-48 h-48 bg-gray/20 rounded-sm flex items-center justify-center">
                  <span className="text-gray text-xs">No image</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 flex flex-col justify-between h-48">
              {/* Header Text - only show if current user received the item */}
              {shouldShowReceivedText && (
                <div className="text-lg font-normal text-black">
                  You received this item in {getLocationString(mostRecentEntry)} on {formatDate(mostRecentEntry.transferDate)}
                </div>
              )}
              
              {/* Offer Button */}
              <div className="w-full">
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
                  className="w-full h-10 bg-tan text-black border border-black py-1 px-4 rounded-sm transition-all text-center text-button shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px] flex items-center justify-center"
                >
                  Offer item
                </button>
              </div>
            </div>
          </div>

          {/* Journey Timeline */}
          <div className="bg-tan border border-black rounded-sm p-6" style={{ marginRight: '-2px', marginBottom: '3px' }}>
            {itemInstance.history.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray">No history available for this item</p>
              </div>
            ) : (
              <div className="space-y-4">
                {itemInstance.history.map((entry, index) => {
                  const isLast = index === itemInstance.history.length - 1
                  return (
                    <div key={entry.id} className="relative flex items-center">
                      {/* Timeline dot */}
                      <div className="w-3 h-3 bg-black rounded-full flex-shrink-0 z-10"></div>
                      
                      {/* Dotted line connecting to next item */}
                      {!isLast && (
                        <div className="absolute left-1.5 top-6 w-px h-4 border-l-2 border-dotted border-black"></div>
                      )}
                      
                      {/* Content */}
                      <div className="ml-4">
                        <div className="text-base font-normal text-black">
                          Traded in {getLocationString(entry)} on {formatDate(entry.transferDate)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Delete Button */}
          <div>
            <button 
              onClick={() => {
                const confirmed = confirm(`Are you sure you want to delete ${itemInstance.catalogItem.name} from your inventory? This action cannot be undone.`)
                if (confirmed) {
                  // Make API call to delete the item
                  fetch(`/api/inventory/${itemInstance.id}`, {
                    method: 'DELETE'
                  })
                  .then(response => {
                    if (response.ok) {
                      router.push('/inventory')
                    } else {
                      alert('Failed to delete item. Please try again.')
                    }
                  })
                  .catch(error => {
                    console.error('Error deleting item:', error)
                    alert('Failed to delete item. Please try again.')
                  })
                }
              }}
              className="w-full h-10 bg-tan text-black border border-black py-1 px-4 rounded-sm transition-all text-center text-button shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px] flex items-center justify-center"
            >
              Delete from inventory
            </button>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}