"use client"

import { useEffect, useState } from "react"
import StarRating from "./StarRating"
import ProfileThumbnail from "./ProfileThumbnail"

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
  const [reviews, setReviews] = useState<Review[]>([])
  const [reputationScore, setReputationScore] = useState<ReputationScore | null>(null)
  const [loading, setLoading] = useState(true)

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

  return (
    <div>
      {/* Overall Rating Summary */}
      <div className="mb-6 p-4 bg-tan/20 border border-black rounded-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-medium">
                {Number(reputationScore.averageRating).toFixed(1)}
              </span>
              <StarRating rating={Math.round(Number(reputationScore.averageRating))} readonly size="medium" />
            </div>
            <p className="text-sm text-gray">
              Based on {reputationScore.totalReviews} review{reputationScore.totalReviews !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Individual Reviews */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border-b border-gray/20 pb-4">
            <div className="flex items-start gap-3">
              <ProfileThumbnail 
                user={review.reviewer} 
                size="sm"
                fromPage={`/users/${userId}`}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium">
                    {review.reviewer.firstName} {review.reviewer.lastName}
                  </p>
                  <StarRating rating={review.rating} readonly size="small" />
                </div>
                
                {review.content && (
                  <p className="text-body mb-2">{review.content}</p>
                )}
                
                <p className="text-xs text-gray">
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
      </div>
    </div>
  )
}