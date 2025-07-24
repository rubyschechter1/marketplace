"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, ArrowLeft, Package } from "lucide-react"
import Button from "@/components/ui/Button"
import BrownHatLoader from "@/components/BrownHatLoader"
import AuthLayout from "@/components/AuthLayout"
import Image from "next/image"
import { validateNoCurrency } from "@/lib/currencyFilter"

export default function NewOfferPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [useInventory, setUseInventory] = useState(false)
  const [inventoryItems, setInventoryItems] = useState<any[]>([])
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<any>(null)
  
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
    setFormData({
      ...formData,
      offeringTitle: item.catalogItem.name,
      offeringDescription: "", // Allow user to add custom description
      photoUrl: item.catalogItem.imageUrl || "",
      photoPreview: item.catalogItem.imageUrl || ""
    })
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
    // Check for currency content
    const validation = validateNoCurrency(value, "Looking for items")
    if (!validation.isValid) {
      setError(validation.error!)
      return
    }
    
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

    // Validate all form fields for currency content
    const titleValidation = validateNoCurrency(formData.offeringTitle, "Item title")
    if (!titleValidation.isValid) {
      setError(titleValidation.error!)
      setIsSubmitting(false)
      return
    }

    const descriptionValidation = validateNoCurrency(formData.offeringDescription, "Item description")
    if (!descriptionValidation.isValid) {
      setError(descriptionValidation.error!)
      setIsSubmitting(false)
      return
    }

    // Validate all seeking items
    for (let i = 0; i < formData.seekingItems.length; i++) {
      const item = formData.seekingItems[i]
      if (item.trim()) {
        const itemValidation = validateNoCurrency(item, `Looking for item ${i + 1}`)
        if (!itemValidation.isValid) {
          setError(itemValidation.error!)
          setIsSubmitting(false)
          return
        }
      }
    }

    try {
      // First, get user's location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
      })

      let itemId = null
      let itemInstanceId = null

      if (useInventory && selectedInventoryItem) {
        // Using inventory item
        itemInstanceId = selectedInventoryItem.id
      } else {
        // Create new item
        const itemResponse = await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.offeringTitle,
            description: formData.offeringDescription,
            imageUrl: formData.photoUrl || null
          })
        })

        if (!itemResponse.ok) {
          throw new Error("Failed to create item")
        }

        const { item } = await itemResponse.json()
        itemId = item.id
      }

      // Create offer with location
      const offerData: any = {
        title: formData.offeringTitle,
        description: formData.offeringDescription,
        lookingFor: formData.seekingItems.filter(i => i),
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        locationName: "Current Location"
      }

      if (itemId) {
        offerData.itemId = itemId
      }
      if (itemInstanceId) {
        offerData.itemInstanceId = itemInstanceId
      }

      const offerResponse = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(offerData)
      })

      if (!offerResponse.ok) {
        throw new Error("Failed to create offer")
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
            <ArrowLeft size={24} />
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
              className={`flex-1 py-3 px-6 text-button rounded-sm border transition-all font-normal shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px] ${
                !useInventory 
                  ? 'bg-tan text-black border-black' 
                  : 'bg-tan text-black border-black'
              }`}
            >
              <Plus size={16} className="inline mr-2" />
              New Item
            </button>
            <button
              type="button"
              onClick={() => setUseInventory(true)}
              className={`flex-1 py-3 px-6 text-button rounded-sm border transition-all font-normal shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px] ${
                useInventory 
                  ? 'bg-tan text-black border-black' 
                  : 'bg-tan text-black border-black'
              }`}
            >
              <Image src="/images/backpack_icon.png" alt="Inventory" width={20} height={20} className="inline mr-2 -translate-y-px" />
              From Inventory
            </button>
          </div>
        </div>

        {useInventory && (
          <div className="mb-6">
            <h3 className="text-body mb-3">Select from your inventory</h3>
            {inventoryItems.length === 0 ? (
              <div className="text-center py-8 border border-black rounded-sm bg-tan">
                <p className="text-gray">No items in your inventory yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {inventoryItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleInventoryItemSelect(item)}
                    className={`p-3 border rounded-sm cursor-pointer transition-colors ${
                      selectedInventoryItem?.id === item.id
                        ? 'border-black bg-tan text-black shadow-[2px_2px_0px_#000000]' 
                        : 'border-black bg-tan hover:bg-black hover:text-tan'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {item.catalogItem.imageUrl ? (
                        <Image
                          src={item.catalogItem.imageUrl}
                          alt={item.catalogItem.name}
                          width={40}
                          height={40}
                          className="rounded-sm object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-sm"></div>
                      )}
                      <div>
                        <h4 className="font-normal">{item.catalogItem.name}</h4>
                        {item.catalogItem.description && (
                          <p className="text-sm opacity-75">{item.catalogItem.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                className="absolute top-2 right-2 bg-white border border-black rounded-sm p-1 hover:bg-tan"
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
                if (!useInventory) {
                  const validation = validateNoCurrency(e.target.value, "Item title")
                  if (!validation.isValid) {
                    setError(validation.error!)
                    return
                  }
                  setError("")
                }
                setFormData({...formData, offeringTitle: e.target.value})
              }}
              className={`w-full p-4 border border-black rounded-sm text-body focus:outline-none focus:ring-1 focus:ring-black ${
                useInventory ? 'bg-gray-100 cursor-not-allowed' : 'bg-tan placeholder-gray'
              }`}
              readOnly={useInventory}
              required
            />
            <textarea
              placeholder={useInventory ? "Add description for this offer (optional)" : "add description (optional)"}
              value={formData.offeringDescription}
              onChange={(e) => {
                const validation = validateNoCurrency(e.target.value, "Item description")
                if (!validation.isValid) {
                  setError(validation.error!)
                  return
                }
                setError("")
                setFormData({...formData, offeringDescription: e.target.value})
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