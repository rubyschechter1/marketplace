"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Plus, ChevronLeft, Package } from "lucide-react"
import Button from "@/components/ui/Button"
import BrownHatLoader from "@/components/BrownHatLoader"
import AuthLayout from "@/components/AuthLayout"
import Image from "next/image"

export default function NewOfferPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [useInventory, setUseInventory] = useState(false)
  const [inventoryItems, setInventoryItems] = useState<any[]>([])
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<any>(null)
  const [showInventoryModal, setShowInventoryModal] = useState(false)
  
  const [formData, setFormData] = useState({
    offeringTitle: "",
    offeringDescription: "",
    seekingItems: [""],
    photoUrl: "",
    photoPreview: ""
  })

  useEffect(() => {
    if (useInventory) {
      fetchInventory()
    }
  }, [useInventory])

  // Handle URL parameters for pre-populating form data
  useEffect(() => {
    const itemId = searchParams.get('itemId')
    const itemName = searchParams.get('itemName')
    const itemDescription = searchParams.get('itemDescription')
    const itemPhoto = searchParams.get('itemPhoto')
    
    if (itemId && itemName) {
      // Pre-populate from inventory item via URL params
      setUseInventory(true)
      setFormData({
        offeringTitle: itemName,
        offeringDescription: itemDescription || "",
        seekingItems: [""],
        photoUrl: itemPhoto || "",
        photoPreview: itemPhoto || ""
      })
      
      // Create a mock selected inventory item for form validation
      setSelectedInventoryItem({
        id: itemId,
        name: itemName,
        description: itemDescription,
        imageUrl: itemPhoto
      })
    } else if (itemId && !itemName) {
      // Fetch item data from API if only itemId is provided
      fetchItemData(itemId)
    }
  }, [searchParams])

  const fetchItemData = async (itemId: string) => {
    try {
      const response = await fetch(`/api/items/${itemId}`)
      if (response.ok) {
        const data = await response.json()
        const item = data.item
        
        // Pre-populate form with fetched item data
        setUseInventory(true)
        setFormData({
          offeringTitle: item.name,
          offeringDescription: item.description || "",
          seekingItems: [""],
          photoUrl: item.imageUrl || "",
          photoPreview: item.imageUrl || ""
        })
        
        // Set selected inventory item
        setSelectedInventoryItem(item)
      }
    } catch (error) {
      console.error('Error fetching item data:', error)
    }
  }

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory')
      if (response.ok) {
        const data = await response.json()
        setInventoryItems(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    }
  }

  const handleInventoryItemSelect = (item: any) => {
    setSelectedInventoryItem(item)
    setUseInventory(true)
    setFormData({
      ...formData,
      offeringTitle: item.name,
      offeringDescription: "", // Allow user to add custom description
      photoUrl: item.imageUrl || "",
      photoPreview: item.imageUrl || ""
    })
    setShowInventoryModal(false)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be less than 5MB")
      return
    }

    // Show preview immediately
    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        photoPreview: reader.result as string
      }))
    }
    reader.readAsDataURL(file)

    // Upload to server
    try {
      const formData = new FormData()
      formData.append("file", file)
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const { url } = await response.json()
      setFormData(prev => ({
        ...prev,
        photoUrl: url
      }))
    } catch (error) {
      setError("Failed to upload photo")
      console.error("Upload error:", error)
    }
  }

  const handleAddSeekingItem = () => {
    setFormData({
      ...formData,
      seekingItems: [...formData.seekingItems, ""]
    })
  }

  const handleSeekingItemChange = (index: number, value: string) => {
    setError("") // Clear any previous errors
    const newItems = [...formData.seekingItems]
    newItems[index] = value
    setFormData({
      ...formData,
      seekingItems: newItems
    })
  }

  const handleRemoveSeekingItem = (index: number) => {
    const newItems = formData.seekingItems.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      seekingItems: newItems.length === 0 ? [""] : newItems
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    // Form validation will be handled on the server side

    try {
      // First, get user's location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
      })

      // Filter out empty seeking items
      const seekingItems = formData.seekingItems.filter(i => i.trim())
      
      // If no seeking items specified, automatically add default options
      const lookingFor = seekingItems.length > 0 
        ? seekingItems 
        : ["other item", "item from inventory"]

      if (useInventory && selectedInventoryItem) {
        // Using inventory item - create offer with existing item
        const offerData = {
          itemId: selectedInventoryItem.id,
          title: formData.offeringTitle,
          description: formData.offeringDescription,
          lookingFor: lookingFor,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          locationName: "Current Location"
        }

        const offerResponse = await fetch("/api/offers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(offerData)
        })

        if (!offerResponse.ok) {
          const errorData = await offerResponse.json()
          throw new Error(errorData.error || "Failed to create offer")
        }
      } else {
        // Create new item and offer together
        const offerWithItemData = {
          itemName: formData.offeringTitle,
          itemDescription: formData.offeringDescription,
          itemImageUrl: formData.photoUrl || null,
          offerTitle: formData.offeringTitle,
          offerDescription: formData.offeringDescription,
          lookingFor: lookingFor,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          locationName: "Current Location"
        }

        const response = await fetch("/api/offers/with-item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(offerWithItemData)
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to create offer")
        }
      }

      router.push("/")
      router.refresh()
    } catch (error: any) {
      setError(error.message || "Failed to create offer")
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div className="max-w-md mx-auto p-6">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/" className="mr-4">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-header font-normal">Offer an item</h1>
        </div>

        {/* Item Source Selection */}
        <div className="mb-6">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => {
                setUseInventory(false)
                setSelectedInventoryItem(null)
                setFormData({
                  offeringTitle: "",
                  offeringDescription: "",
                  seekingItems: [""],
                  photoUrl: "",
                  photoPreview: ""
                })
                // Trigger photo upload
                document.getElementById('photo-upload')?.click()
              }}
              className={`flex-1 py-3 px-6 text-button rounded-sm border transition-all font-normal shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px] flex items-center justify-center ${
                !useInventory 
                  ? 'bg-tan text-black border-black' 
                  : 'bg-tan text-black border-black'
              }`}
            >
              <Plus size={20} className="mr-2" />
              New item
            </button>
            <button
              type="button"
              onClick={() => {
                setShowInventoryModal(true)
                fetchInventory()
              }}
              className={`flex-1 py-3 px-6 text-button rounded-sm border transition-all font-normal shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px] ${
                useInventory 
                  ? 'bg-tan text-black border-black' 
                  : 'bg-tan text-black border-black'
              }`}
            >
              <Image src="/images/backpack_icon.png" alt="Inventory" width={20} height={20} className="inline mr-2 -translate-y-px" />
              From inventory
            </button>
          </div>
        </div>

        {/* Inventory Modal */}
        {showInventoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-tan border-2 border-black rounded-sm max-w-md w-full max-h-[80vh] overflow-hidden">
              {/* Modal Header */}
              <div className="p-4 border-b border-black">
                <div className="flex items-center justify-between">
                  <h3 className="text-header font-normal">Select from your inventory</h3>
                  <button
                    onClick={() => setShowInventoryModal(false)}
                    className="text-black hover:text-gray text-xl font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              {/* Modal Content */}
              <div className="p-4 overflow-y-auto max-h-96">
                {inventoryItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray">No items in your inventory yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {inventoryItems.map((item) => (
                      <div key={item.id} className="cursor-pointer">
                        <div
                          onClick={() => handleInventoryItemSelect(item)}
                          className="block border border-black rounded-sm transition-all shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px]"
                          style={{ 
                            padding: '6px'
                          }}
                        >
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full aspect-square object-cover rounded-sm"
                            />
                          ) : (
                            <div className="w-full aspect-square bg-tan rounded-sm flex items-center justify-center hover:bg-tan/80 transition-colors p-4">
                              <Image
                                src="/images/brownhat_final.png"
                                alt="Default item image"
                                width={32}
                                height={32}
                                className="opacity-50"
                              />
                            </div>
                          )}
                        </div>
                        {/* Item name outside the card */}
                        <div className="text-xs text-center mt-1 text-black">
                          {item.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Hidden photo upload input */}
          <input
            type="file"
            id="photo-upload"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />

          {/* Show uploaded photo if exists */}
          {formData.photoPreview && (
            <div className="relative">
              <img
                src={formData.photoPreview}
                alt="Item preview"
                className="w-full h-48 object-cover rounded-sm"
              />
              <button
                type="button"
                onClick={() => setFormData({...formData, photoUrl: "", photoPreview: ""})}
                className="absolute top-2 right-2 bg-tan border border-black rounded-sm p-1 hover:bg-black hover:text-tan"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>
          )}

          {/* You are offering */}
          <div>
            <h2 className="text-body mb-3">You are offering</h2>
            <input
              type="text"
              placeholder={useInventory ? "Selected from inventory" : "add item title (e.g. blue tennis shoes)"}
              value={formData.offeringTitle}
              onChange={(e) => {
                setFormData({...formData, offeringTitle: e.target.value})
                setError("")
              }}
              className={`w-full p-4 border border-black rounded-sm text-body focus:outline-none focus:ring-1 focus:ring-black ${
                useInventory ? 'bg-tan cursor-not-allowed' : 'bg-tan placeholder-gray'
              }`}
              readOnly={useInventory}
              required
            />
            <textarea
              placeholder={useInventory ? "Add description for this offer (optional)" : "add description (optional)"}
              value={formData.offeringDescription}
              onChange={(e) => {
                setFormData({...formData, offeringDescription: e.target.value})
                setError("")
              }}
              className="w-full p-4 mt-3 border border-black rounded-sm bg-tan placeholder-gray text-body focus:outline-none focus:ring-1 focus:ring-black resize-none"
              rows={3}
            />
          </div>

          {/* You are looking for */}
          <div>
            <h2 className="text-body mb-3">You are looking for</h2>
            <div className="space-y-3">
              {formData.seekingItems.map((item, index) => (
                <div key={index} className="relative">
                  <input
                    type="text"
                    placeholder="add item name (e.g. travel tips)"
                    value={item}
                    onChange={(e) => handleSeekingItemChange(index, e.target.value)}
                    className="w-full p-4 border border-black rounded-sm bg-tan placeholder-gray text-body focus:outline-none focus:ring-1 focus:ring-black"
                  />
                  {formData.seekingItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSeekingItem(index)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray hover:text-black"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={handleAddSeekingItem}
                className="w-full bg-tan text-black border border-black rounded-sm py-3 px-6 text-button font-normal flex items-center justify-center hover:bg-black hover:text-tan transition-colors"
              >
                <Plus size={20} className="mr-2" />
                <span className="text-body">Add item</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-body">{error}</div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            fullWidth
            variant="primary"
            disabled={isSubmitting || !formData.offeringTitle}
            className="mt-8"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <BrownHatLoader size="small" />
                <span className="ml-2">Creating offer...</span>
              </div>
            ) : "Submit offer"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  )
}