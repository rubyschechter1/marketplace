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
): T {
  const transformed = { ...obj }
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