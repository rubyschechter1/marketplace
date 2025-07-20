import AuthLayout from "@/components/AuthLayout"
import BrownHatLoader from "@/components/BrownHatLoader"
import OfferCardSkeleton from "@/components/OfferCardSkeleton"

export default function Loading() {
  return (
    <AuthLayout>
      <main className="p-6 max-w-md mx-auto">
        {/* Location header skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-8 bg-gray/20 rounded w-48 mb-2" />
          <div className="h-4 bg-gray/20 rounded w-32" />
        </div>
        
        {/* Action buttons skeleton */}
        <div className="space-y-4 mb-8">
          <div className="h-14 bg-gray/20 rounded-xl" />
          <div className="h-14 bg-gray/20 rounded-xl" />
        </div>

        {/* Your offers section */}
        <div className="mb-8">
          <h2 className="text-lg font-normal mb-4">Your offered items</h2>
          <div className="space-y-4">
            <OfferCardSkeleton />
            <OfferCardSkeleton />
          </div>
        </div>
        
        {/* Your asks section */}
        <div>
          <h2 className="text-lg font-normal mb-4">Your asks</h2>
          <div className="space-y-4">
            <OfferCardSkeleton />
          </div>
        </div>
      </main>
    </AuthLayout>
  )
}