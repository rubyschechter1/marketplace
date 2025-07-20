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
    <div className="mx-5 p-4 bg-tan border border-black rounded-lg">
      <h3 className="font-medium mb-3 text-center">
        {existingReview ? "Update your review" : "Rate your exchange"} with {revieweeName}
      </h3>
      
      <div className="mb-4 flex justify-center">
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
        className="w-full p-2 bg-tan border border-black rounded-lg resize-none placeholder-gray focus:outline-none focus:ring-1 focus:ring-black"
        rows={3}
      />

      {error && (
        <p className="text-red-600 text-sm mt-2">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || rating === 0}
        className="mt-3 w-full bg-tan text-black border border-black p-2 rounded-lg hover:bg-black hover:text-tan transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Submitting..." : existingReview ? "Update Review" : "Submit Review"}
      </button>
    </div>
  )
}