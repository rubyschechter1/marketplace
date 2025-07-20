"use client"

import { useState } from "react"
import StarRating from "./StarRating"

interface ReviewFormProps {
  proposedTradeId: string
  revieweeName: string
  onSubmit: () => void
  existingReview?: {
    rating: number
    content: string | null
  }
}

export default function ReviewForm({ 
  proposedTradeId, 
  revieweeName,
  onSubmit,
  existingReview
}: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [content, setContent] = useState(existingReview?.content || "")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposedTradeId,
          rating,
          content: content.trim() || null
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to submit review")
      }

      onSubmit()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="font-medium mb-3">
        {existingReview ? "Update your review" : "Rate your experience"} with {revieweeName}
      </h3>
      
      <div className="mb-4">
        <StarRating 
          rating={rating} 
          onRatingChange={setRating}
          size="large"
        />
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your experience (optional)"
        className="w-full p-3 border border-gray/20 rounded-lg resize-none"
        rows={3}
      />

      {error && (
        <p className="text-red-600 text-sm mt-2">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || rating === 0}
        className="mt-3 w-full py-2 bg-green text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Submitting..." : existingReview ? "Update Review" : "Submit Review"}
      </button>
    </div>
  )
}