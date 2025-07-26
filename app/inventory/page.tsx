"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import AuthLayout from "@/components/AuthLayout"
import Image from "next/image"
import Link from "next/link"
import Button from "@/components/ui/Button"
import BrownHatLoader from "@/components/BrownHatLoader"

interface Item {
  id: string
  name: string
  description: string | null
  category: string | null
  condition: string | null
  imageUrl: string | null
  serialNumber: string | null
  acquisitionMethod: string
  createdAt: string
  instanceCreatedAt: string
  history: Array<{
    id: string
    transferDate: string
    city: string | null
    country: string | null
    transferMethod: string
  }>
}

export default function InventoryPage() {
  const { data: session } = useSession()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory')
      if (!response.ok) {
        throw new Error('Failed to fetch inventory')
      }
      const data = await response.json()
      setItems(data.items || [])
    } catch (error) {
      console.error('Error fetching inventory:', error)
      setError('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  const getLocationString = (item: Item) => {
    console.log("🗺️ Checking location for item:", item.name, "History:", item.history)
    
    // Check if there's any history
    if (!item.history || item.history.length === 0) {
      console.log("❌ No history found for item")
      return "Unknown location"
    }
    
    const latestHistory = item.history[0] // Most recent first
    console.log("📍 Latest history entry:", latestHistory)
    
    if (latestHistory?.city && latestHistory?.country) {
      return `${latestHistory.city}, ${latestHistory.country}`
    }
    
    // Fallback to any history entry with location data
    for (const historyEntry of item.history) {
      if (historyEntry?.city && historyEntry?.country) {
        console.log("📍 Using fallback history entry:", historyEntry)
        return `${historyEntry.city}, ${historyEntry.country}`
      }
    }
    
    console.log("❌ No location data found in any history entry")
    return "Unknown location"
  }

  const getItemAge = (item: Item) => {
    const created = new Date(item.instanceCreatedAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return "1 day"
    if (diffDays < 30) return `${diffDays} days`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`
    return `${Math.floor(diffDays / 365)} years`
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center min-h-screen pb-16">
          <BrownHatLoader size="large" text="Loading inventory..." />
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="p-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-normal mb-2">My Inventory</h1>
          <p className="text-gray">Items you've collected on your travels</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <Image
                src="/images/brownhat_final.png"
                alt="Empty inventory"
                width={64}
                height={64}
                className="mx-auto opacity-50"
              />
            </div>
            <h3 className="text-lg font-normal mb-2">No items yet</h3>
            <p className="text-gray mb-6">
              Get started by posting an item to trade
            </p>
            <div className="max-w-xs mx-auto">
              <Link href="/offers/new">
                <Button fullWidth variant="secondary">
                  Offer an Item
                </Button>
              </Link>
              <div className="h-4"></div>
              <Link href="/asks/new">
                <Button fullWidth variant="outline">
                  Post an Ask
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-8">
            {items.map((item) => (
              <Link 
                key={item.id}
                href={`/history/${item.id}`}
                className="block relative border border-black rounded-sm transition-all shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px]"
                style={{ 
                  padding: '12px 12px 30px 12px'
                }}
              >
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full aspect-square object-cover rounded-sm"
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray/20 rounded-sm flex items-center justify-center hover:bg-gray/30 transition-colors">
                    <span className="text-gray text-sm text-center px-2">
                      {item.name}
                    </span>
                  </div>
                )}
                {/* Item age in bottom area */}
                <div className="absolute bottom-1 left-1 bg-tan text-black text-xs px-2 py-1 rounded-sm">
                  Acquired {getItemAge(item)} ago in {getLocationString(item)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AuthLayout>
  )
}