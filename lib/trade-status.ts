// Utility functions for computing trade status from the new acceptedTradeId model

export type ComputedTradeStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'unavailable'

interface Trade {
  id: string
  isRejected: boolean
  isWithdrawn: boolean
  offer: {
    acceptedTradeId: string | null
  }
}

/**
 * Computes the effective status of a trade based on the new model
 * This replaces direct access to trade.status field
 */
export function getTradeStatus(trade: Trade): ComputedTradeStatus {
  // Check boolean flags first
  if (trade.isRejected) return 'rejected'
  if (trade.isWithdrawn) return 'withdrawn'
  
  // Check if this trade is the accepted one
  if (trade.offer.acceptedTradeId === trade.id) return 'accepted'
  
  // Check if another trade was accepted for this offer
  if (trade.offer.acceptedTradeId && trade.offer.acceptedTradeId !== trade.id) {
    return 'unavailable'
  }
  
  // Otherwise it's pending
  return 'pending'
}

/**
 * Check if a trade has a specific status
 * Convenience function for common status checks
 */
export function isTradeStatus(trade: Trade, status: ComputedTradeStatus): boolean {
  return getTradeStatus(trade) === status
}

/**
 * Check if a trade is in an active state (not rejected or withdrawn)
 */
export function isTradeActive(trade: Trade): boolean {
  return !trade.isRejected && !trade.isWithdrawn
}