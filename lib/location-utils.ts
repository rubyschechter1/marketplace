/**
 * Location utility functions for geocoding and distance calculations
 */

interface GeocodeResult {
  city: string | null
  country: string | null
  displayLocation: string
}

/**
 * Geocode coordinates to get city and country using Mapbox API
 */
export async function geocodeCoordinates(lat: number, lng: number): Promise<GeocodeResult> {
  const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN
  
  if (!mapboxToken) {
    console.warn('MAPBOX_ACCESS_TOKEN not set, returning fallback location')
    return {
      city: null,
      country: null,
      displayLocation: 'Unknown Location'
    }
  }

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&types=place,country&limit=1`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.features || data.features.length === 0) {
      return {
        city: null,
        country: null,
        displayLocation: 'Unknown Location'
      }
    }

    let city = null
    let country = null

    // Parse Mapbox response
    for (const feature of data.features) {
      if (feature.place_type?.includes('place')) {
        city = feature.text
      }
      
      // Look for country in context
      if (feature.context) {
        const countryContext = feature.context.find((c: any) => c.id.startsWith('country'))
        if (countryContext) {
          country = countryContext.text
        }
      }
      
      // If feature is a country itself
      if (feature.place_type?.includes('country')) {
        country = feature.text
      }
    }

    const displayLocation = [city, country].filter(Boolean).join(', ') || 'Unknown Location'

    return {
      city,
      country,
      displayLocation
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return {
      city: null,
      country: null,
      displayLocation: 'Unknown Location'
    }
  }
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  // Round to 1 decimal place
  return Math.round(distance * 10) / 10
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Sanitize location data for client consumption
 * Removes exact coordinates for privacy
 */
export function sanitizeLocationForClient(
  offer: any,
  includeCoordinates: boolean = false
): any {
  const sanitized = { ...offer }
  
  // Always remove raw coordinates unless explicitly included (for own offers)
  if (!includeCoordinates) {
    delete sanitized.latitude
    delete sanitized.longitude
  }
  
  return sanitized
}

/**
 * Format distance for display
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`
  }
  return `${distance}km`
}