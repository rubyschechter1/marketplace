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
          <div className="h-14 bg-gray/20 rounded-sm" />
          <div className="h-14 bg-gray/20 rounded-sm" />
        </div>

        {/* Your offers section */}
        <div className="mb-8">
          <h2 className="text-lg font-normal mb-4 text-center">Your offered items</h2>
          <div className="grid grid-cols-2 gap-8">
            {/* Square skeleton for offered items */}
            <div className="relative aspect-square bg-gray/20 rounded-sm animate-pulse">
              <div className="absolute bottom-3 left-3 bg-tan text-black border border-black text-xs px-2 py-1 rounded-sm h-5 w-12"></div>
            </div>
            <div className="relative aspect-square bg-gray/20 rounded-sm animate-pulse">
              <div className="absolute bottom-3 left-3 bg-tan text-black border border-black text-xs px-2 py-1 rounded-sm h-5 w-12"></div>
            </div>
          </div>
        </div>
        
        {/* Your asks section */}
        <div>
          <h2 className="text-lg font-normal mb-4 text-center">Your asks</h2>
          <div className="grid grid-cols-2 gap-8">
            {/* Square skeleton for asks */}
            <div className="aspect-square bg-tan border border-black rounded-sm p-8 flex items-center justify-center animate-pulse">
              <div className="h-6 bg-black/20 rounded w-24"></div>
            </div>
            <div className="aspect-square bg-tan border border-black rounded-sm p-8 flex items-center justify-center animate-pulse">
              <div className="h-6 bg-black/20 rounded w-20"></div>
            </div>
          </div>
        </div>
      </main>
    </AuthLayout>
  )
}