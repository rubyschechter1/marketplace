"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import AuthLayout from "@/components/AuthLayout"
import Image from "next/image"
import Link from "next/link"
import Button from "@/components/ui/Button"

interface ItemInstance {
  id: string
  serialNumber: string | null
  acquisitionMethod: string
  createdAt: string
  catalogItem: {
    id: string
    name: string
    description: string | null
    category: string | null
    condition: string | null
    imageUrl: string | null
  }
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
  const [items, setItems] = useState<ItemInstance[]>([])
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

  const getLocationString = (item: ItemInstance) => {
    const latestHistory = item.history[0] // Most recent first
    if (latestHistory?.city && latestHistory?.country) {
      return `${latestHistory.city}, ${latestHistory.country}`
    }
    return "Unknown location"
  }

  const getItemAge = (item: ItemInstance) => {
    const created = new Date(item.createdAt)
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
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray">Loading inventory...</div>
          </div>
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
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="border border-black rounded-sm p-4 bg-white hover:shadow-[2px_2px_0px_#000000] transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  {item.catalogItem.imageUrl ? (
                    <Image
                      src={item.catalogItem.imageUrl}
                      alt={item.catalogItem.name}
                      width={60}
                      height={60}
                      className="rounded-sm object-cover"
                    />
                  ) : (
                    <div className="w-15 h-15 bg-gray-200 rounded-sm flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No image</span>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="font-normal text-lg">{item.catalogItem.name}</h3>
                    <p className="text-gray text-sm mb-2">
                      Acquired {getItemAge(item)} ago
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs bg-tan px-2 py-1 rounded-sm border border-black">
                        {getLocationString(item)}
                      </span>
                      {item.history.length > 1 && (
                        <span className="text-xs text-gray">
                          {item.history.length} locations
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/history/${item.id}`}
                      className="inline-flex items-center text-xs bg-tan text-black border border-black px-3 py-1 rounded-sm hover:bg-black hover:text-tan transition-colors shadow-[2px_2px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[1px] hover:translate-y-[1px]"
                    >
                      View History
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthLayout>
  )
}