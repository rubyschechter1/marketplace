"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, ArrowLeft } from "lucide-react"
import Button from "@/components/ui/Button"

export default function NewOfferPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    offeringTitle: "",
    offeringDescription: "",
    seekingItems: [""],
    photoUrl: "",
    photoPreview: ""
  })

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

    try {
      // First, get user's location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
      })

      // Create item
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

      // Create offer with location
      const offerResponse = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          title: formData.offeringTitle,
          description: `Looking for: ${formData.seekingItems.filter(i => i).join(", ")}`,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          locationName: "Current Location"
        })
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
    <div className="min-h-screen bg-tan">
      <div className="max-w-md mx-auto p-6">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/" className="mr-4">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-header font-normal">Offer an item</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Add Photo */}
          <div>
            <input
              type="file"
              id="photo-upload"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            {formData.photoPreview ? (
              <div className="relative">
                <img
                  src={formData.photoPreview}
                  alt="Item preview"
                  className="w-full h-48 object-cover border border-black rounded-sm"
                />
                <button
                  type="button"
                  onClick={() => setFormData({...formData, photoUrl: "", photoPreview: ""})}
                  className="absolute top-2 right-2 bg-white border border-black rounded-sm p-1 hover:bg-tan"
                >
                  <span className="text-lg leading-none">×</span>
                </button>
              </div>
            ) : (
              <label
                htmlFor="photo-upload"
                className="w-full border border-black rounded-sm p-4 flex items-center justify-center hover:bg-white transition-colors cursor-pointer block"
              >
                <Plus size={20} className="mr-2" />
                <span className="text-body">Add a photo</span>
              </label>
            )}
          </div>

          {/* You are offering */}
          <div>
            <h2 className="text-body mb-3">You are offering</h2>
            <input
              type="text"
              placeholder="add item title (e.g. blue tennis shoes)"
              value={formData.offeringTitle}
              onChange={(e) => setFormData({...formData, offeringTitle: e.target.value})}
              className="w-full p-4 border border-black rounded-sm bg-transparent placeholder-gray text-body focus:outline-none focus:ring-1 focus:ring-black"
              required
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
                    className="w-full p-4 border border-black rounded-sm bg-transparent placeholder-gray text-body focus:outline-none focus:ring-1 focus:ring-black"
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
                className="w-full border border-black rounded-sm p-4 flex items-center justify-center hover:bg-white transition-colors"
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
            {isSubmitting ? "Creating offer..." : "Submit Offer"}
          </Button>
        </form>
      </div>
    </div>
  )
}