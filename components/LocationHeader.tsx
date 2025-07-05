"use client"

import { useLocation } from "@/contexts/LocationContext"
import ProfileThumbnail from "./ProfileThumbnail"

interface LocationHeaderProps {
  user: {
    id: string
    firstName: string
    lastName?: string
    avatarUrl?: string | null
  }
}

export default function LocationHeader({ user }: LocationHeaderProps) {
  const { location } = useLocation()

  return (
    <div className="flex items-center gap-3 mb-8">
      <ProfileThumbnail 
        user={user}
        size="sm"
      />
      <p className="text-body">
        You are currently in {location.loading ? "..." : location.displayLocation}
      </p>
    </div>
  )
}