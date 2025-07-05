"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import AuthLayout from "@/components/AuthLayout"
import { Search as SearchIcon, MapPin } from "lucide-react"
import Link from "next/link"
import OfferCard from "@/components/OfferCard"

interface Offer {
  id: string
  title: string
  locationName: string
  item: {
    name: string
    imageUrl?: string
  }
  traveler: {
    id: string
    firstName: string
    lastName: string
  }
}

export default function SearchPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push('/')
      return
    }

    fetchOffers()
  }, [status, router])

  const fetchOffers = async () => {
    try {
      // Pass 0,0 for lat/lng to get all offers (will remove distance filtering)
      const response = await fetch('/api/offers?lat=0&lng=0&status=active')
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched offers:', data)
        setOffers(data.offers || [])
      } else {
        console.error('Failed to fetch offers:', response.status, await response.text())
      }
    } catch (error) {
      console.error('Error fetching offers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOffers = offers.filter(offer => {
    if (!offer.item) return false // Skip offers without items
    return searchTerm === "" || 
      offer.item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.title.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <AuthLayout>
      <main className="p-6 max-w-md mx-auto">
        <h1 className="text-header font-normal mb-6">Search</h1>
        
        {/* Search Input */}
        <div className="relative mb-8">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray" size={20} />
          <input
            type="text"
            placeholder="Search for items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-black rounded-sm text-body placeholder-gray focus:outline-none focus:ring-1 focus:ring-black bg-tan"
          />
        </div>

        {/* Filter Options */}
        <div className="mb-8">
          <p className="text-body text-gray mb-3">Filters</p>
          <div className="flex gap-2 flex-wrap">
            <button className="px-4 py-2 bg-tan text-black border border-black rounded-sm text-body hover:bg-black hover:text-tan transition-colors">
              All Items
            </button>
            <button className="px-4 py-2 bg-tan border border-thin rounded-sm text-body text-gray hover:bg-black hover:text-tan hover:border-black transition-colors">
              Camping
            </button>
            <button className="px-4 py-2 bg-tan border border-thin rounded-sm text-body text-gray hover:bg-black hover:text-tan hover:border-black transition-colors">
              Travel
            </button>
            <button className="px-4 py-2 bg-tan border border-thin rounded-sm text-body text-gray hover:bg-black hover:text-tan hover:border-black transition-colors">
              Electronics
            </button>
          </div>
        </div>

        {/* Search Results */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-body text-gray text-center py-12">Loading offers...</p>
          ) : filteredOffers.length === 0 ? (
            <p className="text-body text-gray text-center py-12">
              {searchTerm ? "No items match your search" : "No active offers available"}
            </p>
          ) : (
            filteredOffers.map((offer) => (
              <OfferCard 
                key={offer.id} 
                offer={offer} 
                currentUserId={session?.user?.id || ''} 
              />
            ))
          )}
        </div>
      </main>
    </AuthLayout>
  )
}