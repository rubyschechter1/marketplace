const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testDeleteLogic(itemId) {
  console.log(`\n🧪 Testing delete logic for item: ${itemId}\n`)
  
  try {
    // Run the same query as the delete endpoint
    const activeTrades = await prisma.proposedTrades.findMany({
      where: {
        OR: [
          { offeredItemId: itemId },
          { 
            offer: {
              itemId: itemId
            }
          }
        ],
        isRejected: false,
        isWithdrawn: false
      },
      include: {
        offer: {
          select: {
            acceptedTradeId: true,
            status: true,
            title: true
          }
        }
      }
    })
    
    console.log(`Active trades found: ${activeTrades.length}`)
    
    for (const trade of activeTrades) {
      console.log(`\nTrade ${trade.id}:`)
      console.log(`  Offer: ${trade.offer.title}`)
      console.log(`  Offer status: ${trade.offer.status}`)
      console.log(`  Is accepted: ${trade.offer.acceptedTradeId === trade.id}`)
    }
    
    // Filter out trades where the offer is completed
    const nonCompletedTrades = activeTrades.filter(trade => 
      trade.offer.status !== 'completed'
    )
    
    console.log(`\nNon-completed trades: ${nonCompletedTrades.length}`)
    
    // Check if any of these trades are accepted or potentially active
    const hasAcceptedTrade = nonCompletedTrades.some(trade => 
      trade.offer.acceptedTradeId === trade.id
    )
    
    const hasPendingTrade = nonCompletedTrades.some(trade => 
      !trade.offer.acceptedTradeId || trade.offer.acceptedTradeId === trade.id
    )
    
    console.log(`\nHas accepted trade (non-completed): ${hasAcceptedTrade}`)
    console.log(`Has pending trade (non-completed): ${hasPendingTrade}`)
    
    if (hasAcceptedTrade) {
      console.log('\n❌ Item cannot be deleted - part of an accepted trade')
    } else if (hasPendingTrade) {
      console.log('\n❌ Item cannot be deleted - part of pending trades')
    } else {
      console.log('\n✅ Item can now be deleted!')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Test with the problematic item
testDeleteLogic('bd72a73b-8356-452a-8a63-fc8d948be33d')