export default function OfferCardSkeleton() {
  return (
    <div className="bg-tan border border-black rounded-xl p-6 animate-pulse">
      <div className="flex items-start gap-4">
        {/* Image skeleton */}
        <div className="w-16 h-16 bg-gray/20 rounded-md flex-shrink-0" />
        
        <div className="flex-1">
          {/* Title skeleton */}
          <div className="h-5 bg-gray/20 rounded w-3/4 mb-2" />
          
          {/* Location skeleton */}
          <div className="h-4 bg-gray/20 rounded w-1/2 mb-3" />
          
          {/* Looking for skeleton */}
          <div className="flex flex-wrap gap-2">
            <div className="h-6 bg-gray/20 rounded-full w-20" />
            <div className="h-6 bg-gray/20 rounded-full w-24" />
          </div>
        </div>
      </div>
    </div>
  )
}