"use client"

import { useLocation } from "@/contexts/LocationContext"
import LocationPermissionScreen from "./LocationPermissionScreen"

export default function LocationGuard({ children }: { children: React.ReactNode }) {
  const { location } = useLocation()
  
  console.log("🚪 LocationGuard - permission state:", location.permissionState, "has coordinates:", !!location.latitude, "error:", location.error)
  
  // Show permission screen if:
  // 1. Permission is denied
  // 2. We have an error AND permission is not granted AND we don't have cached coordinates
  // 3. Permission state is prompt and we don't have coordinates
  const needsPermission = 
    location.permissionState === 'denied' ||
    (location.error && location.permissionState !== 'granted' && !location.latitude) ||
    (location.permissionState === 'prompt' && !location.latitude)
  
  console.log("🚪 LocationGuard - needs permission:", needsPermission)
  
  if (needsPermission) {
    return <LocationPermissionScreen />
  }
  
  return <>{children}</>
}