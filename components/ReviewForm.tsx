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
  inline?: boolean
  buttonText?: string
  isGiftMode?: boolean
}

export default function ReviewForm({ 
  proposedTradeId, 
  revieweeName,
  onSubmit,
  existingReview,
  inline = false,
  buttonText,
  isGiftMode = false
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
    <div className={`${inline ? '' : 'mx-5'} p-4 bg-gray/10 rounded-sm`}>
      <h3 className="font-medium mb-3 text-center text-gray text-sm">
        {existingReview ? "Update your review" : (isGiftMode ? "Rate your gift experience" : "Rate your exchange")} with {revieweeName}
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
        placeholder="Share your experience! (optional, but helps us keep the platform transparent and safe for everyone!)"
        className="w-full p-2 bg-tan border border-gray/20 rounded-sm resize-none placeholder-gray focus:outline-none focus:ring-1 focus:ring-gray"
        rows={3}
      />

      {error && (
        <p className="text-red-600 text-sm mt-2">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || rating === 0}
        className="mt-3 w-full bg-tan text-black border border-black p-2 rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-black hover:text-tan"
      >
        {submitting ? "Submitting..." : buttonText || (existingReview ? "Update review" : "Submit review")}
      </button>
    </div>
  )
}