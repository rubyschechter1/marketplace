"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import AuthLayout from "@/components/AuthLayout"
import { Search as SearchIcon } from "lucide-react"
import Link from "next/link"
import OfferCard from "@/components/OfferCard"
import LocationHeader from "@/components/LocationHeader"
import { useLocation } from "@/contexts/LocationContext"
import BrownHatLoader from "@/components/BrownHatLoader"
import OfferCardSkeleton from "@/components/OfferCardSkeleton"

interface Offer {
  id: string
  type?: string
  title: string
  askDescription?: string
  locationName: string
  item?: {
    name: string
    imageUrl?: string
  }
  itemInstance?: {
    catalogItem: {
      name: string
      imageUrl?: string
    }
  }
  traveler: {
    id: string
    firstName: string
    lastName: string
    avatarUrl?: string | null
  }
  lookingFor?: string[]
  _count?: {
    messages: number
    proposedTrades: number
  }
  displayLocation?: string | null
  distance?: number
}

export default function SearchPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { location } = useLocation()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"offer" | "ask">("offer")
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push('/')
      return
    }

    fetchOffers()
    fetchCurrentUser()
  }, [status, router])

  // Re-fetch offers when location or filter type changes
  useEffect(() => {
    if (!location.loading && location.latitude && location.longitude) {
      fetchOffers()
    }
  }, [location.latitude, location.longitude, filterType])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/users/me')
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data.user)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const fetchOffers = async () => {
    try {
      // Use user's location if available, otherwise pass 0,0
      const lat = location.latitude || 0
      const lng = location.longitude || 0
      const response = await fetch(`/api/offers?lat=${lat}&lng=${lng}&status=active&type=${filterType}`)
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
    if (searchTerm === "") return true
    
    const searchLower = searchTerm.toLowerCase()
    
    // For asks, search in title and askDescription
    if (offer.type === 'ask') {
      return offer.title.toLowerCase().includes(searchLower) ||
        (offer.askDescription && offer.askDescription.toLowerCase().includes(searchLower))
    }
    
    // For regular offers, search in item name (both regular and inventory items) and title
    return (offer.item?.name.toLowerCase().includes(searchLower) || false) ||
      (offer.itemInstance?.catalogItem?.name.toLowerCase().includes(searchLower) || false) ||
      offer.title.toLowerCase().includes(searchLower)
  })

  return (
    <AuthLayout>
      <main className="p-6 max-w-md mx-auto">
        {/* Location header with profile picture */}
        {currentUser && (
          <LocationHeader user={currentUser} />
        )}
        
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

        {/* Offers/Asks Toggle Slider */}
        <div className="mb-8">
          <div className="relative inline-flex bg-tan border border-black rounded-sm p-1 shadow-[3px_3px_0px_#000000]">
            {/* Sliding background indicator */}
            <div 
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-black rounded-sm transition-all duration-200 ease-out ${
                filterType === "offer" ? "left-1" : "left-[calc(50%+2px)]"
              }`}
            />
            
            {/* Buttons */}
            <button 
              onClick={() => setFilterType("offer")}
              className={`relative z-10 px-6 py-2 text-body transition-colors duration-200 rounded-sm ${
                filterType === "offer" 
                  ? "text-tan" 
                  : "text-black hover:text-gray"
              }`}
            >
              Offers
            </button>
            <button 
              onClick={() => setFilterType("ask")}
              className={`relative z-10 px-6 py-2 text-body transition-colors duration-200 rounded-sm ${
                filterType === "ask" 
                  ? "text-tan" 
                  : "text-black hover:text-gray"
              }`}
            >
              Asks
            </button>
          </div>
        </div>

        {/* Search Results */}
        <div className="space-y-4">
          {loading ? (
            <>
              <OfferCardSkeleton />
              <OfferCardSkeleton />
              <OfferCardSkeleton />
            </>
          ) : filteredOffers.length === 0 ? (
            <p className="text-body text-gray text-center py-12">
              {searchTerm 
                ? `No ${filterType}s match your search` 
                : `No active ${filterType}s available`}
            </p>
          ) : (
            filteredOffers.map((offer) => (
              <OfferCard 
                key={offer.id} 
                offer={offer} 
                currentUserId={session?.user?.id || ''} 
                fromPage="/search"
              />
            ))
          )}
        </div>
      </main>
    </AuthLayout>
  )
}