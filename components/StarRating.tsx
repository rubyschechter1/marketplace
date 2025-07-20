"use client"

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
    small: "w-6 h-6",
    medium: "w-7 h-7",
    large: "w-8 h-8"
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
          <img
            src={value <= rating ? '/images/brownhat.png' : '/images/hat_full_empty.png'}
            alt={value <= rating ? 'Selected hat' : 'Empty hat'}
            className={`${sizeClasses[size]} object-contain ${value <= rating ? 'scale-110' : ''}`}
          />
        </button>
      ))}
    </div>
  )
}