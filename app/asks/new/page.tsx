"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, ArrowLeft } from "lucide-react"
import Button from "@/components/ui/Button"
import AuthLayout from "@/components/AuthLayout"

export default function NewAskPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    askTitle: "",
    askDescription: "",
    offeringItems: [""]
  })

  const handleAddOfferingItem = () => {
    setFormData({
      ...formData,
      offeringItems: [...formData.offeringItems, ""]
    })
  }

  const handleOfferingItemChange = (index: number, value: string) => {
    const newItems = [...formData.offeringItems]
    newItems[index] = value
    setFormData({
      ...formData,
      offeringItems: newItems
    })
  }

  const handleRemoveOfferingItem = (index: number) => {
    const newItems = formData.offeringItems.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      offeringItems: newItems.length === 0 ? [""] : newItems
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

      // Create ask (which is a type of offer)
      const askResponse = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ask",
          title: formData.askTitle,
          askDescription: formData.askDescription,
          lookingFor: formData.offeringItems.filter(i => i),
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          locationName: "Current Location"
        })
      })

      if (!askResponse.ok) {
        throw new Error("Failed to create ask")
      }

      router.push("/")
      router.refresh()
    } catch (error: any) {
      setError(error.message || "Failed to create ask")
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
          <h1 className="text-header font-normal">Post an ask</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* You are asking for */}
          <div>
            <h2 className="text-body mb-3">You are asking for</h2>
            <input
              type="text"
              placeholder="add a title (e.g. warm winter jacket)"
              value={formData.askTitle}
              onChange={(e) => setFormData({...formData, askTitle: e.target.value})}
              className="w-full p-4 border border-black rounded-sm bg-tan placeholder-gray text-body focus:outline-none focus:ring-1 focus:ring-black"
              required
            />
            <textarea
              placeholder="describe what you're looking for (e.g. I need a warm jacket for winter hiking, size M or L)"
              value={formData.askDescription}
              onChange={(e) => setFormData({...formData, askDescription: e.target.value})}
              className="w-full p-4 mt-3 border border-black rounded-sm bg-tan placeholder-gray text-body focus:outline-none focus:ring-1 focus:ring-black resize-none"
              rows={3}
              required
            />
          </div>

          {/* You can offer in return */}
          <div>
            <h2 className="text-body mb-3">You can offer in return</h2>
            <div className="space-y-3">
              {formData.offeringItems.map((item, index) => (
                <div key={index} className="relative">
                  <input
                    type="text"
                    placeholder="add item name (e.g. travel tips)"
                    value={item}
                    onChange={(e) => handleOfferingItemChange(index, e.target.value)}
                    className="w-full p-4 border border-black rounded-sm bg-tan placeholder-gray text-body focus:outline-none focus:ring-1 focus:ring-black"
                  />
                  {formData.offeringItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOfferingItem(index)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray hover:text-black"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={handleAddOfferingItem}
                className="w-full bg-tan text-black border border-black rounded-sm p-4 flex items-center justify-center hover:bg-black hover:text-tan transition-colors"
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
            disabled={isSubmitting || !formData.askTitle || !formData.askDescription}
            className="mt-8"
          >
            {isSubmitting ? "Creating ask..." : "Submit Ask"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  )
}