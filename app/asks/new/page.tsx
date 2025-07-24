"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Plus, ArrowLeft, PackageOpen } from "lucide-react"
import Button from "@/components/ui/Button"
import AuthLayout from "@/components/AuthLayout"
import { validateNoCurrency } from "@/lib/currencyFilter"

export default function NewAskPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [showInventoryModal, setShowInventoryModal] = useState(false)
  const [inventoryItems, setInventoryItems] = useState<any[]>([])
  const [loadingInventory, setLoadingInventory] = useState(false)
  
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
    // Check for currency content
    const validation = validateNoCurrency(value, "Offering items")
    if (!validation.isValid) {
      setError(validation.error!)
      return
    }
    
    setError("") // Clear any previous errors
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

  const fetchInventory = async () => {
    setLoadingInventory(true)
    try {
      const response = await fetch('/api/inventory')
      if (response.ok) {
        const data = await response.json()
        setInventoryItems(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoadingInventory(false)
    }
  }

  const handleAddFromInventory = (itemName: string) => {
    // Add the inventory item name to the offering items list
    const newItems = [...formData.offeringItems]
    const emptyIndex = newItems.findIndex(item => item === "")
    
    if (emptyIndex !== -1) {
      // Replace empty slot
      newItems[emptyIndex] = itemName
    } else {
      // Add to end
      newItems.push(itemName)
    }
    
    setFormData({
      ...formData,
      offeringItems: newItems
    })
    
    setShowInventoryModal(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    // Validate all form fields for currency content
    const titleValidation = validateNoCurrency(formData.askTitle, "Ask title")
    if (!titleValidation.isValid) {
      setError(titleValidation.error!)
      setIsSubmitting(false)
      return
    }

    const descriptionValidation = validateNoCurrency(formData.askDescription, "Ask description")
    if (!descriptionValidation.isValid) {
      setError(descriptionValidation.error!)
      setIsSubmitting(false)
      return
    }

    // Validate all offering items
    for (let i = 0; i < formData.offeringItems.length; i++) {
      const item = formData.offeringItems[i]
      if (item.trim()) {
        const itemValidation = validateNoCurrency(item, `Offering item ${i + 1}`)
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
              onChange={(e) => {
                const validation = validateNoCurrency(e.target.value, "Ask title")
                if (!validation.isValid) {
                  setError(validation.error!)
                  return
                }
                setError("")
                setFormData({...formData, askTitle: e.target.value})
              }}
              className="w-full p-4 border border-black rounded-sm bg-tan placeholder-gray text-body focus:outline-none focus:ring-1 focus:ring-black"
              required
            />
            <textarea
              placeholder="describe what you're looking for (e.g. I need a warm jacket for winter hiking, size M or L)"
              value={formData.askDescription}
              onChange={(e) => {
                const validation = validateNoCurrency(e.target.value, "Ask description")
                if (!validation.isValid) {
                  setError(validation.error!)
                  return
                }
                setError("")
                setFormData({...formData, askDescription: e.target.value})
              }}
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
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleAddOfferingItem}
                  className="flex-1 bg-tan text-black border border-black rounded-sm py-3 px-6 flex items-center justify-center transition-all shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px]"
                >
                  <Plus size={20} className="mr-2" />
                  <span className="text-body">Add item</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowInventoryModal(true)
                    fetchInventory()
                  }}
                  className="flex-1 bg-tan text-black border border-black rounded-sm py-3 px-6 flex items-center justify-center transition-all shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px]"
                >
                  <Image src="/images/backpack_icon.png" alt="Inventory" width={20} height={20} className="mr-2" />
                  <span className="text-body">From inventory</span>
                </button>
              </div>
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
            {isSubmitting ? "Creating ask..." : "Submit ask"}
          </Button>
        </form>
        
        {/* Inventory Selection Modal */}
        {showInventoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-tan border border-black rounded-sm max-w-md w-full max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b border-black">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-normal">Select from Inventory</h3>
                  <button
                    onClick={() => setShowInventoryModal(false)}
                    className="text-black hover:text-gray"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="p-4 overflow-y-auto max-h-96">
                {loadingInventory ? (
                  <div className="text-center py-8">
                    <p className="text-body">Loading inventory...</p>
                  </div>
                ) : inventoryItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-body text-gray">No items in your inventory yet.</p>
                    <p className="text-sm text-gray mt-2">Items you receive from trades will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {inventoryItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border border-black rounded-sm bg-white hover:shadow-[2px_2px_0px_#000000] transition-shadow"
                      >
                        <div className="flex items-center space-x-3">
                          {item.catalogItem.imageUrl ? (
                            <img
                              src={item.catalogItem.imageUrl}
                              alt={item.catalogItem.name}
                              className="w-10 h-10 object-cover rounded-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-sm flex items-center justify-center">
                              <PackageOpen size={16} className="text-gray" />
                            </div>
                          )}
                          <div>
                            <h5 className="font-normal">{item.catalogItem.name}</h5>
                            {item.catalogItem.description && (
                              <p className="text-sm text-gray">{item.catalogItem.description}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddFromInventory(item.catalogItem.name)}
                          className="bg-tan text-black border border-black px-3 py-1 rounded-sm text-sm hover:bg-black hover:text-tan transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}