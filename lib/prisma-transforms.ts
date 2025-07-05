/**
 * Utility functions to transform Prisma Decimal fields to plain numbers
 * This prevents serialization errors when passing data from Server to Client Components
 */

/**
 * Generic utility to transform Prisma Decimal fields to numbers
 */
export function transformDecimalFields<T extends Record<string, any>>(
  obj: T,
  fields: string[]
): any {
  const transformed: any = { ...obj }
  fields.forEach(field => {
    if (transformed[field]?.toNumber) {
      transformed[field] = transformed[field].toNumber()
    } else if (transformed[field] === null || transformed[field] === undefined) {
      transformed[field] = null
    }
  })
  return transformed
}

/**
 * Transform a single offer's Decimal fields
 */
export function transformOffer(offer: any) {
  if (!offer) return offer
  return transformDecimalFields(offer, ['latitude', 'longitude'])
}

/**
 * Transform an array of offers
 */
export function transformOffers(offers: any[]) {
  if (!offers) return []
  return offers.map(transformOffer)
}

/**
 * Transform a user object with offers
 */
export function transformUserWithOffers(user: any) {
  if (!user) return null
  
  return {
    ...user,
    offers: user.offers ? transformOffers(user.offers) : []
  }
}

/**
 * Transform offer with location privacy
 * Removes exact coordinates and adds distance if user location provided
 */
export function transformOfferWithLocation(
  offer: any, 
  userLat?: number, 
  userLng?: number,
  isOwnOffer: boolean = false
): any {
  if (!offer) return offer
  
  // First transform Decimal fields
  const transformed = transformOffer(offer)
  
  // Calculate distance if user location is provided
  if (userLat !== undefined && userLng !== undefined && 
      transformed.latitude && transformed.longitude) {
    // Import at runtime to avoid circular dependency
    const { calculateDistance } = require('./location-utils')
    transformed.distance = calculateDistance(
      userLat, 
      userLng, 
      transformed.latitude, 
      transformed.longitude
    )
  }
  
  // Remove exact coordinates unless it's user's own offer
  if (!isOwnOffer) {
    delete transformed.latitude
    delete transformed.longitude
  }
  
  return transformed
}

/**
 * Transform array of offers with location privacy
 */
export function transformOffersWithLocation(
  offers: any[], 
  userLat?: number, 
  userLng?: number,
  userId?: string
): any[] {
  if (!offers) return []
  
  return offers.map(offer => 
    transformOfferWithLocation(
      offer, 
      userLat, 
      userLng, 
      offer.travelerId === userId
    )
  )
}