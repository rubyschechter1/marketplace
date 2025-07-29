"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import AuthLayout from "@/components/AuthLayout"
import Link from "next/link"
import { ChevronLeft, MapPin, Calendar, Camera, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import BrownHatLoader from "@/components/BrownHatLoader"
import { getDisplayName } from "@/lib/formatName"
import Image from "next/image"
import BackButton from "@/components/BackButton"

interface HistoryEntry {
  id: string
  transferDate: string
  city: string | null
  country: string | null
  transferMethod: string
  receiverAvatarUrl: string | null
}

interface Item {
  id: string
  name: string
  description: string | null
  category: string | null
  condition: string | null
  imageUrl: string | null
  serialNumber: string | null
  acquisitionMethod: string
  isAvailable: boolean
  createdAt: string
  instanceCreatedAt: string
  currentOwnerId: string
  history: HistoryEntry[]
}

export default function ItemHistoryPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ itemId: string }>,
  searchParams: Promise<{ from?: string }>
}) {
  const { data: session } = useSession()
  const router = useRouter()
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [itemId, setItemId] = useState("")
  const [fromPage, setFromPage] = useState("")
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    params.then(p => setItemId(p.itemId))
    searchParams.then(sp => setFromPage(sp.from || ''))
  }, [params, searchParams])

  useEffect(() => {
    if (!itemId) return
    
    const fetchItemHistory = async () => {
      try {
        const response = await fetch(`/api/history/${itemId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch item history')
        }
        const data = await response.json()
        setItem(data.item)
      } catch (error) {
        console.error('Error fetching item history:', error)
        router.push('/inventory')
      } finally {
        setLoading(false)
      }
    }

    fetchItemHistory()
  }, [itemId, router])

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center min-h-screen pb-16">
          <BrownHatLoader size="large" text="Loading item history..." />
        </div>
      </AuthLayout>
    )
  }

  if (!item) {
    return (
      <AuthLayout>
        <div className="max-w-md mx-auto p-6">
          <p className="text-center text-gray">Item not found</p>
        </div>
      </AuthLayout>
    )
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Please select an image smaller than 5MB')
      return
    }

    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const { url } = await response.json()

      // Update the item with the new image
      const updateResponse = await fetch(`/api/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: url }),
      })

      if (!updateResponse.ok) {
        throw new Error('Failed to update item image')
      }

      // Update local state
      setItem(prev => prev ? {
        ...prev,
        imageUrl: url
      } : null)

    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Failed to upload photo. Please try again.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/inventory/${itemId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete item')
      }

      router.push('/inventory')
    } catch (error) {
      console.error('Error deleting item:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete item. Please try again.')
    }
  }

  const handleOfferItem = () => {
    router.push(`/offers/new?itemId=${itemId}`)
  }

  const isCurrentOwner = session?.user?.id === item?.currentOwnerId
  const hasImage = item?.imageUrl

  return (
    <AuthLayout>
      <div className="max-w-md mx-auto bg-tan min-h-screen">
        {/* Header */}
        <div className="bg-tan p-6">
          <div className="flex items-center justify-center relative mb-1">
            <button 
              onClick={() => {
                if (fromPage.startsWith('offer-')) {
                  const offerId = fromPage.replace('offer-', '')
                  router.push(`/offers/${offerId}`)
                } else if (fromPage === 'inventory') {
                  router.push('/inventory')
                } else if (window.history.length > 1) {
                  router.back()
                } else {
                  router.push('/inventory')
                }
              }}
              className="absolute left-0 p-2 text-brown hover:bg-brown/10 rounded-lg transition-colors" 
              style={{ marginLeft: '-32px' }}
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-black">
              {item?.name}'s Journey
            </h1>
          </div>
        </div>

        {/* Item Image and Action Buttons */}
        <div className="px-6 py-0">
          <div className="mb-6 flex justify-center items-start gap-6">
            {/* Image */}
            <div className="flex-shrink-0">
              {hasImage ? (
                <div className="w-48 h-48 rounded-sm overflow-hidden">
                  <Image
                    src={item.imageUrl!}
                    alt={item.name}
                    width={192}
                    height={192}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : isCurrentOwner ? (
                <div className="relative">
                  <label htmlFor="photo-upload" className={`block w-48 h-48 border-2 border-dashed border-brown/30 rounded-sm flex flex-col items-center justify-center cursor-pointer hover:border-brown/50 transition-colors ${uploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {uploadingPhoto ? (
                      <BrownHatLoader size="small" />
                    ) : (
                      <>
                        <Camera size={32} className="text-brown/50 mb-2" />
                        <span className="text-sm text-brown/70">No image</span>
                      </>
                    )}
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                  <p className="text-sm text-brown/70 mt-2 text-center">Click to upload a photo</p>
                </div>
              ) : (
                <div className="w-48 h-48 border-2 border-dashed border-brown/30 rounded-sm flex flex-col items-center justify-center">
                  <Camera size={32} className="text-brown/30 mb-2" />
                  <span className="text-sm text-brown/50">No image</span>
                </div>
              )}
            </div>

            {/* Action Buttons - only show for current owner */}
            {isCurrentOwner && (
              <div className="flex flex-col space-y-3 w-48">
                <button
                  onClick={handleOfferItem}
                  className="w-full bg-tan text-black border border-black py-3 px-4 rounded-sm transition-all text-center font-medium shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px]"
                >
                  Offer Item
                </button>
                
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full bg-tan text-black border border-black py-3 px-4 rounded-sm transition-all text-center font-medium"
                >
                  Delete Item
                </button>
              </div>
            )}
          </div>


          {/* Timeline */}
          <div>
            <h3 className="text-lg font-medium text-black mb-4">Trade History</h3>
            
            {item.history.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray">No trades yet</p>
                <p className="text-sm text-gray/70 mt-1">This item has stayed with its original owner</p>
              </div>
            ) : (
              <div className="space-y-4">
                {item.history
                  .sort((a, b) => new Date(b.transferDate).getTime() - new Date(a.transferDate).getTime())
                  .map((entry, index) => {
                    const date = new Date(entry.transferDate).toLocaleDateString()
                    const location = entry.city && entry.country 
                      ? `${entry.city}, ${entry.country}`
                      : entry.city || entry.country || 'Unknown location'
                    
                    return (
                      <div key={entry.id} className="flex items-center space-x-3 p-4 bg-tan rounded-sm border border-brown/10">
                        {/* Profile Image */}
                        <div className="flex-shrink-0">
                          {entry.receiverAvatarUrl ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden">
                              <Image
                                src={entry.receiverAvatarUrl}
                                alt="Receiver"
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-brown/10 flex items-center justify-center">
                              <span className="text-xs font-medium text-brown">
                                ?
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Timeline Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center text-sm">
                            <div>
                              <span className="text-gray">Traded in {location}</span>
                            </div>
                            <div>
                              <span className="text-gray/70">{date}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-tan border border-black rounded-sm max-w-sm w-full p-6 shadow-[3px_3px_0px_#000000]">
              <h3 className="text-lg font-medium text-black mb-2">Delete Item</h3>
              <p className="text-sm text-gray mb-6">
                Are you sure you want to delete "{item?.name}"? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-black bg-tan border border-black rounded-sm hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px] transition-all shadow-[3px_3px_0px_#000000]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 text-sm font-medium text-black bg-tan border border-black rounded-sm hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px] transition-all shadow-[3px_3px_0px_#000000]"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}