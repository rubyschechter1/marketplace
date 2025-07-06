"use client"

import { useLocation } from "@/contexts/LocationContext"
import LocationPermissionScreen from "./LocationPermissionScreen"

export default function LocationGuard({ children }: { children: React.ReactNode }) {
  const { location } = useLocation()
  
  // Show permission screen if:
  // 1. Permission is denied
  // 2. We have an error (except if permission is already granted)
  // 3. Permission state is unknown and we don't have coordinates
  const needsPermission = 
    location.permissionState === 'denied' ||
    (location.error && location.permissionState !== 'granted') ||
    (location.permissionState === 'unknown' && !location.latitude)
  
  if (needsPermission) {
    return <LocationPermissionScreen />
  }
  
  return <>{children}</>
}