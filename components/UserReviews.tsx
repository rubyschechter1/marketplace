"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Star } from "lucide-react"
import ProfileThumbnail from "./ProfileThumbnail"
import { getDisplayName } from "@/lib/formatName"

interface Review {
  id: string
  rating: number
  content: string | null
  createdAt: string
  isEdited: boolean
  reviewer: {
    id: string
    firstName: string
    lastName: string
    avatarUrl: string | null
  }
  proposedTrade: {
    offer: {
      id: string
      title: string
      type: string
    }
    offeredItem: {
      id: string
      name: string
    }
  }
}

interface ReputationScore {
  totalReviews: number
  averageRating: number
  credibilityScore: number
}

interface UserReviewsProps {
  userId: string
}

export default function UserReviews({ userId }: UserReviewsProps) {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<Review[]>([])
  const [reputationScore, setReputationScore] = useState<ReputationScore | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAllReviews, setShowAllReviews] = useState(false)

  useEffect(() => {
    async function fetchReviews() {
      try {
        const response = await fetch(`/api/reviews/user/${userId}`)
        if (response.ok) {
          const data = await response.json()
          setReviews(data.reviews)
          setReputationScore(data.reputationScore)
        }
      } catch (error) {
        console.error("Error fetching reviews:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [userId])

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray">Loading reviews...</p>
      </div>
    )
  }

  if (!reputationScore || reputationScore.totalReviews === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray">No reviews yet</p>
      </div>
    )
  }

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3)
  const remainingReviews = reviews.length - 3

  return (
    <div className="space-y-4">
      {displayedReviews.map((review) => (
        <div key={review.id} className="border-b border-gray/20 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 flex-shrink-0">
              <ProfileThumbnail 
                user={review.reviewer} 
                size="sm"
                fromPage={`/users/${userId}`}
              />
            </div>
            <div className="flex-1 text-left">
              <div className="mb-2">
                <p className="font-medium mb-1 text-left">
                  {getDisplayName(
                    { id: review.reviewer.id, firstName: review.reviewer.firstName, lastName: review.reviewer.lastName },
                    session?.user?.id
                  )}
                </p>
                <div className="flex gap-0.5 justify-start">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <img
                      key={star}
                      src={star <= review.rating ? '/images/brownhat.png' : '/images/hat_full_empty.png'}
                      alt={star <= review.rating ? 'Selected hat' : 'Empty hat'}
                      className="w-5 h-5 object-contain"
                    />
                  ))}
                </div>
              </div>
              
              {review.content && (
                <p className="text-body mb-2 text-left">{review.content}</p>
              )}
              
              <p className="text-xs text-gray text-left">
                Traded: {review.proposedTrade.offer.type === 'ask' 
                  ? review.proposedTrade.offeredItem.name 
                  : review.proposedTrade.offer.title
                } • {new Date(review.createdAt).toLocaleDateString()}
                {review.isEdited && ' • Edited'}
              </p>
            </div>
          </div>
        </div>
      ))}
      
      {/* See more button */}
      {!showAllReviews && reviews.length > 3 && (
        <div className="text-center pt-4 pb-4">
          <button
            onClick={() => setShowAllReviews(true)}
            className="bg-tan text-black border border-black px-4 py-2 rounded-sm text-sm hover:bg-black hover:text-tan transition-colors shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            See more {remainingReviews} review{remainingReviews !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  )
}