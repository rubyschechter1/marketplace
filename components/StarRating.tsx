"use client"

import { Star } from "lucide-react"

interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  readonly?: boolean
  size?: "small" | "medium" | "large"
}

export default function StarRating({ 
  rating, 
  onRatingChange, 
  readonly = false,
  size = "medium" 
}: StarRatingProps) {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-5 h-5",
    large: "w-6 h-6"
  }

  const handleClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value)
    }
  }

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          onClick={() => handleClick(value)}
          disabled={readonly}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
          type="button"
        >
          <Star
            className={`${sizeClasses[size]} ${
              value <= rating 
                ? 'fill-yellow-500 text-yellow-500' 
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}