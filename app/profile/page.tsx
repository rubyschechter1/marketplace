"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import AuthLayout from "@/components/AuthLayout"
import SignOutButton from "@/components/SignOutButton"
import ProfileEditor from "@/components/ProfileEditor"
import ProfileHeader from "@/components/ProfileHeader"
import UserReviews from "@/components/UserReviews"
import BrownHatLoader from "@/components/BrownHatLoader"
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
  const [reputationScore, setReputationScore] = useState<{ totalReviews: number; averageRating: number } | null>(null)
  const [reviewCount, setReviewCount] = useState(0)
  
  const userId = searchParams.get('id') || session?.user?.id
  const fromPage = searchParams.get('from')
  const isOwnProfile = session?.user?.id === userId

  console.log('Profile page - Session status:', status, 'Session:', session, 'userId:', userId)

  useEffect(() => {
    if (status === "loading") return
    
    if (!userId) {
      console.log('No userId found, redirecting to home')
      router.push("/")
      return
    }

    async function fetchUser() {
      try {
        console.log('Fetching user data for:', userId)
        const [userResponse, reviewsResponse] = await Promise.all([
          fetch(`/api/users/${userId}`),
          fetch(`/api/reviews/user/${userId}`)
        ])
        
        console.log('User response status:', userResponse.status)
        if (userResponse.ok) {
          const userData = await userResponse.json()
          console.log('User data loaded:', userData)
          setUser(userData)
        } else {
          const errorData = await userResponse.json()
          console.error('Failed to fetch user:', errorData)
          router.push("/")
          return
        }
        
        if (reviewsResponse.ok) {
          const reviewData = await reviewsResponse.json()
          setReputationScore(reviewData.reputationScore)
          setReviewCount(reviewData.reviews?.length || 0)
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
        <main className="p-6 max-w-md mx-auto h-screen flex items-center justify-center">
          <BrownHatLoader size="large" text="Loading profile..." />
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

  // Separate offers from asks
  const actualOffers = (user.offers || []).filter((offer: any) => offer.item?.name) // Has an item = actual offer
  const asks = (user.offers || []).filter((offer: any) => !offer.item?.name) // No item = ask
  
  // Get list of offered items
  const offeredItems = actualOffers.map((offer: any) => offer.item.name)

  const hasEnoughReviewsForSticky = reviewCount >= 1

  return (
    <AuthLayout>
      <main className={`max-w-md mx-auto ${hasEnoughReviewsForSticky ? 'h-screen flex flex-col' : 'p-6'}`}>
        {/* Sticky Header Content */}
        <div className={`${hasEnoughReviewsForSticky ? 'flex-shrink-0 p-2 pb-0' : ''}`}>
          {/* Profile Header Component */}
          <ProfileHeader 
            user={{
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName || undefined,
              avatarUrl: user.avatarUrl,
              createdAt: user.createdAt
            }} 
            isOwnProfile={isOwnProfile} 
            reputationScore={reputationScore || undefined}
          />

          {/* Email Section - Only show for own profile */}
          {isOwnProfile && (
            <div className={hasEnoughReviewsForSticky ? "mb-1" : "mb-6"}>
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
              <div className={hasEnoughReviewsForSticky ? "mb-1" : "mb-6"}>
                <h2 className="text-lg mb-1">About</h2>
                {user.bio ? (
                  <p className="text-sm whitespace-pre-line">{user.bio}</p>
                ) : (
                  <p className="text-sm text-gray italic">No bio yet.</p>
                )}
              </div>

              {/* Read-only Languages Section for other users */}
              <div className={hasEnoughReviewsForSticky ? "mb-1" : "mb-6"}>
                <h2 className="text-lg mb-0">Speaks</h2>
                <p className="text-sm text-gray italic">
                  {user.languages && user.languages.length > 0 
                    ? user.languages.join(', ')
                    : "No languages added yet"
                  }
                </p>
              </div>

              {/* Read-only Countries Visited Section for other users */}
              <div className={hasEnoughReviewsForSticky ? "mb-1" : "mb-6"}>
                <h2 className="text-lg mb-0">Countries visited</h2>
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
          <div className={hasEnoughReviewsForSticky ? "mb-4" : "mb-6"}>
            <h2 className="text-lg mb-0">Has offered {actualOffers.length} items</h2>
            <p className="text-sm text-gray italic">
              {offeredItems.length > 0 
                ? offeredItems.join(', ')
                : "No items offered yet"
              }
            </p>
          </div>

          {/* Reviews Header */}
          <div id="reviews" className={`flex items-center gap-2 ${hasEnoughReviewsForSticky ? "mb-1" : "mb-4"}`}>
            <h2 className="text-lg">Reviews</h2>
            {reviewCount > 0 && (
              <span className="text-lg text-gray">({reviewCount})</span>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className={`${hasEnoughReviewsForSticky ? 'flex-1 overflow-y-auto px-4 min-h-0' : reviewCount > 0 ? 'max-h-[600px] overflow-y-auto mb-8' : 'mb-8'}`}>
          <UserReviews userId={user.id} />
        </div>

        {/* Bottom Buttons */}
        <div className={`${hasEnoughReviewsForSticky ? 'flex-shrink-0 p-2 pt-0' : ''}`}>
          {/* Sign Out Button - Only for own profile */}
          {isOwnProfile && (
            <div className="w-full mb-6">
              <SignOutButton className="w-full bg-tan text-black border border-black rounded-sm py-3 text-sm hover:bg-black hover:text-tan transition-colors" />
            </div>
          )}

          {/* Back Button - Only show if viewing someone else's profile */}
          {!isOwnProfile && (
            <div className="w-full">
              <button 
                onClick={handleBackClick}
                className="w-full bg-tan text-black border border-black rounded-sm py-3 text-sm hover:bg-black hover:text-tan transition-colors flex items-center justify-center"
              >
                Back
              </button>
            </div>
          )}
        </div>
      </main>
    </AuthLayout>
  )
}