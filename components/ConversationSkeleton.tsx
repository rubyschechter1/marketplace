export default function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 animate-pulse">
      {/* Image skeleton */}
      <div className="w-16 h-16 bg-gray/20 rounded-md flex-shrink-0" />
      
      <div className="flex-1 bg-tan border border-black rounded-sm p-4">
        <div className="flex items-start justify-between gap-2">
          {/* Title skeleton */}
          <div className="h-5 bg-gray/20 rounded w-2/3 mb-2" />
          
          {/* Notification badge skeleton */}
          <div className="h-5 w-5 bg-gray/20 rounded-full flex-shrink-0" />
        </div>
        
        {/* Message preview skeleton */}
        <div className="h-4 bg-gray/20 rounded w-3/4" />
      </div>
    </div>
  )
}