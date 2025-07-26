"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

type PermissionState = 'prompt' | 'granted' | 'denied' | 'unknown'

interface LocationData {
  latitude: number | null
  longitude: number | null
  city: string | null
  country: string | null
  displayLocation: string
  loading: boolean
  error: string | null
  permissionState: PermissionState
}

interface LocationContextType {
  location: LocationData
  refreshLocation: () => Promise<void>
  requestPermission: () => Promise<void>
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)

export function LocationProvider({ children }: { children: ReactNode }) {
  // Initialize state with cached data if available
  const [location, setLocation] = useState<LocationData>(() => {
    if (typeof window === 'undefined') {
      return {
        latitude: null,
        longitude: null,
        city: null,
        country: null,
        displayLocation: "Unknown Location",
        loading: false,
        error: null,
        permissionState: 'unknown'
      }
    }

    try {
      const cached = localStorage.getItem('brownstrawhat-location')
      if (cached) {
        const parsedCache = JSON.parse(cached)
        // Only use cache if it's recent (within 5 minutes)
        if (Date.now() - parsedCache.timestamp < 300000) {
          return {
            ...parsedCache.data,
            loading: false,
            error: null
          }
        }
      }
    } catch (error) {
      console.error('Error loading cached location:', error)
    }

    return {
      latitude: null,
      longitude: null,
      city: null,
      country: null,
      displayLocation: "Unknown Location",
      loading: false,
      error: null,
      permissionState: 'unknown'
    }
  })

  // Cache location data in localStorage
  const cacheLocationData = (locationData: LocationData) => {
    if (typeof window === 'undefined' || !locationData.latitude) return
    
    try {
      const cacheData = {
        data: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          city: locationData.city,
          country: locationData.country,
          displayLocation: locationData.displayLocation,
          permissionState: locationData.permissionState
        },
        timestamp: Date.now()
      }
      localStorage.setItem('brownstrawhat-location', JSON.stringify(cacheData))
    } catch (error) {
      console.error('Error caching location:', error)
    }
  }

  const geocodeCoordinates = async (lat: number, lng: number) => {
    try {
      // For now, we'll geocode on the client side
      // In production, you might want to move this to an API route
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}&types=place,country&limit=1`
      )

      if (!response.ok) {
        throw new Error("Geocoding failed")
      }

      const data = await response.json()
      
      if (!data.features || data.features.length === 0) {
        return {
          city: null,
          country: null,
          displayLocation: "Unknown Location"
        }
      }

      let city = null
      let country = null

      for (const feature of data.features) {
        if (feature.place_type?.includes('place')) {
          city = feature.text
        }
        
        if (feature.context) {
          const countryContext = feature.context.find((c: any) => c.id.startsWith('country'))
          if (countryContext) {
            country = countryContext.text
          }
        }
        
        if (feature.place_type?.includes('country')) {
          country = feature.text
        }
      }

      const displayLocation = [city, country].filter(Boolean).join(', ') || 'Unknown Location'

      return { city, country, displayLocation }
    } catch (error) {
      console.error("Geocoding error:", error)
      return {
        city: null,
        country: null,
        displayLocation: "Unknown Location"
      }
    }
  }

  const checkPermissionState = async (): Promise<PermissionState> => {
    if (!navigator.permissions || !navigator.permissions.query) {
      return 'unknown'
    }
    
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' })
      return result.state as PermissionState
    } catch {
      return 'unknown'
    }
  }

  const refreshLocation = async (isUserInitiated = false) => {
    console.log("🗺️ Requesting location, user initiated:", isUserInitiated)
    setLocation(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Check permission state first
      const permissionState = await checkPermissionState()
      console.log("🗺️ Current permission state:", permissionState)
      setLocation(prev => ({ ...prev, permissionState }))

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        })
      })

      const { latitude, longitude } = position.coords
      console.log("🗺️ Got coordinates:", latitude, longitude)
      const geocoded = await geocodeCoordinates(latitude, longitude)
      console.log("🗺️ Geocoded location:", geocoded)

      const newLocationData = {
        latitude,
        longitude,
        city: geocoded.city,
        country: geocoded.country,
        displayLocation: geocoded.displayLocation,
        loading: false,
        error: null,
        permissionState: 'granted' as PermissionState
      }
      
      setLocation(newLocationData)
      cacheLocationData(newLocationData)

      // Update user's last known location in database
      try {
        await fetch('/api/users/location', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: latitude,
            longitude: longitude,
            city: geocoded.city,
            country: geocoded.country
          })
        })
        console.log("📍 User location updated in database")
      } catch (error) {
        console.error("❌ Failed to update user location in database:", error)
        // Don't throw - location still works for the session even if DB update fails
      }
    } catch (error: any) {
      console.error("🗺️ Location error:", error)
      let errorMessage = "Failed to get location"
      
      // Provide more specific error messages
      if (error.code === 1) {
        errorMessage = "Location permission denied"
      } else if (error.code === 2) {
        errorMessage = "Location unavailable"
      } else if (error.code === 3) {
        errorMessage = "Location request timeout"
      }
      
      const permissionState = await checkPermissionState()
      console.log("🗺️ Error, final permission state:", permissionState)
      
      setLocation(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        permissionState
      }))
    }
  }

  const requestPermission = async () => {
    await refreshLocation(true)
  }

  useEffect(() => {
    // Check permission state on mount but don't request location
    checkPermissionState().then(state => {
      console.log("🗺️ Location permission state:", state)
      setLocation(prev => {
        const newState = { ...prev, permissionState: state }
        
        // Auto-request if already granted OR if we have cached location data
        if (state === 'granted' || (state !== 'denied' && prev.latitude)) {
          console.log("🗺️ Permission granted or cached data available, auto-requesting location...")
          // Use setTimeout to avoid state update during render
          setTimeout(() => refreshLocation(), 0)
        } else {
          console.log("🗺️ Permission not granted, waiting for user action")
        }
        
        return newState
      })
    })
  }, [])

  return (
    <LocationContext.Provider value={{ location, refreshLocation, requestPermission }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider")
  }
  return context
}