"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import AuthLayout from "@/components/AuthLayout"
import SignOutButton from "@/components/SignOutButton"
import ProfileEditor from "@/components/ProfileEditor"
import ProfileHeader from "@/components/ProfileHeader"
import UserReviews from "@/components/UserReviews"
import { ChevronLeft } from "lucide-react"

interface UserWithOffers {
  id: string
  email: string
  firstName: string
  lastName: string | null
  bio: string | null
  avatarUrl: string | null
  languages: string[]
  countriesVisited: string[]
  createdAt: string
  offers: Array<{
    id: string
    title: string
    status: string
    item: {
      name: string
    } | null
  }>
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<UserWithOffers | null>(null)
  const [loading, setLoading] = useState(true)
  
  const userId = searchParams.get('id') || session?.user?.id
  const fromPage = searchParams.get('from')
  const isOwnProfile = session?.user?.id === userId

  useEffect(() => {
    if (status === "loading") return
    
    if (!userId) {
      router.push("/")
      return
    }

    async function fetchUser() {
      try {
        const response = await fetch(`/api/users/${userId}`)
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        } else {
          router.push("/")
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [userId, status, router])

  const handleBackClick = () => {
    if (fromPage) {
      // Decode the fromPage parameter and navigate back
      const decodedFromPage = decodeURIComponent(fromPage)
      router.push(decodedFromPage)
    } else {
      // Default back behavior
      router.back()
    }
  }

  if (loading) {
    return (
      <AuthLayout>
        <main className="p-6 max-w-md mx-auto">
          <p>Loading...</p>
        </main>
      </AuthLayout>
    )
  }

  if (!user) {
    return (
      <AuthLayout>
        <main className="p-6 max-w-md mx-auto">
          <p>User not found</p>
        </main>
      </AuthLayout>
    )
  }

  // Get list of offered items
  const offeredItems = (user.offers || []).map((offer: any) => offer.item?.name).filter(Boolean)

  return (
    <AuthLayout>
      <main className="p-6 max-w-md mx-auto">
        {/* Profile Header Component */}
        <ProfileHeader user={{
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName || undefined,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt
        }} isOwnProfile={isOwnProfile} />

        {/* Email Section - Only show for own profile */}
        {isOwnProfile && (
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <p className="text-sm">Email: {user.email}</p>
            </div>
          </div>
        )}

        {/* Profile Editor Component - Only for own profile */}
        {isOwnProfile ? (
          <ProfileEditor user={{
            id: user.id,
            bio: user.bio,
            languages: user.languages,
            countriesVisited: user.countriesVisited || []
          }} />
        ) : (
          <>
            {/* Read-only About Section for other users */}
            <div className="mb-6">
              <h2 className="text-lg mb-3">About</h2>
              {user.bio ? (
                <p className="text-sm whitespace-pre-line">{user.bio}</p>
              ) : (
                <p className="text-sm text-gray italic">No bio yet.</p>
              )}
            </div>

            {/* Read-only Languages Section for other users */}
            <div className="mb-6">
              <h2 className="text-lg mb-2">Speaks</h2>
              <p className="text-sm text-gray italic">
                {user.languages && user.languages.length > 0 
                  ? user.languages.join(', ')
                  : "No languages added yet"
                }
              </p>
            </div>

            {/* Read-only Countries Visited Section for other users */}
            <div className="mb-6">
              <h2 className="text-lg mb-2">Countries visited</h2>
              <p className="text-sm text-gray italic">
                {user.countriesVisited && user.countriesVisited.length > 0 
                  ? user.countriesVisited.join(', ')
                  : "No countries added yet"
                }
              </p>
            </div>
          </>
        )}

        {/* Offered Items Section */}
        <div className="mb-6">
          <h2 className="text-lg mb-2">Has offered {(user.offers || []).length} items</h2>
          <p className="text-sm text-gray italic">
            {offeredItems.length > 0 
              ? offeredItems.join(', ')
              : "No items offered yet"
            }
          </p>
        </div>


        {/* Reviews Section */}
        <div className="mb-8">
          <h2 className="text-lg mb-4">Reviews</h2>
          <UserReviews userId={user.id} />
        </div>

        {/* Sign Out Button - Only for own profile */}
        {isOwnProfile && (
          <div className="w-full mb-6">
            <SignOutButton className="w-full bg-tan text-black border border-black rounded-lg py-3 text-sm hover:bg-black hover:text-tan transition-colors" />
          </div>
        )}

        {/* Back Button - Only show if viewing someone else's profile */}
        {!isOwnProfile && (
          <div className="w-full">
            <button 
              onClick={handleBackClick}
              className="w-full bg-tan text-black border border-black rounded-lg py-3 text-sm hover:bg-black hover:text-tan transition-colors flex items-center justify-center"
            >
              <ChevronLeft size={20} className="mr-1" />
              Back
            </button>
          </div>
        )}
      </main>
    </AuthLayout>
  )
}