const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkOfferStatus() {
  console.log('\n🔍 Checking offer status for trade 9d33d370-489c-45ac-a314-a359cee72010\n')
  
  try {
    const trade = await prisma.proposedTrades.findUnique({
      where: { id: '9d33d370-489c-45ac-a314-a359cee72010' },
      include: {
        offer: {
          include: {
            traveler: true,
            item: true
          }
        },
        proposer: true,
        offeredItem: {
          include: {
            currentOwner: true
          }
        },
        reviews: true
      }
    })
    
    if (!trade) {
      console.log('❌ Trade not found!')
      return
    }
    
    console.log('📋 Trade Details:')
    console.log(`  Trade ID: ${trade.id}`)
    console.log(`  Status (old field): ${trade.status}`)
    console.log(`  isRejected: ${trade.isRejected}`)
    console.log(`  isWithdrawn: ${trade.isWithdrawn}`)
    console.log(`  Number of reviews: ${trade.reviews.length}`)
    
    console.log('\n📦 Offer Details:')
    console.log(`  Offer: ${trade.offer.title}`)
    console.log(`  Offer Status: ${trade.offer.status}`)
    console.log(`  AcceptedTradeId: ${trade.offer.acceptedTradeId}`)
    console.log(`  Offer Owner: ${trade.offer.traveler.firstName} ${trade.offer.traveler.lastName}`)
    
    console.log('\n🪑 Offered Item (chair):')
    console.log(`  Name: ${trade.offeredItem?.name}`)
    console.log(`  Current Owner: ${trade.offeredItem?.currentOwner.firstName} ${trade.offeredItem?.currentOwner.lastName}`)
    console.log(`  Original Proposer: ${trade.proposer.firstName} ${trade.proposer.lastName}`)
    
    // Check if items have been transferred
    const itemsTransferred = trade.offeredItem && 
                            trade.offeredItem.currentOwnerId !== trade.proposerId
    
    console.log('\n🔄 Transfer Status:')
    console.log(`  Items transferred: ${itemsTransferred}`)
    console.log(`  Both parties reviewed: ${trade.reviews.length >= 2}`)
    
    // Check item history
    const itemHistory = await prisma.itemHistory.findMany({
      where: {
        OR: [
          { itemId: trade.offeredItem?.id },
          { itemId: trade.offer.item?.id }
        ],
        tradeId: trade.id
      }
    })
    
    console.log(`  Item history entries for this trade: ${itemHistory.length}`)
    
    console.log('\n💡 Analysis:')
    if (trade.offer.status === 'completed' && trade.offer.acceptedTradeId === trade.id) {
      console.log('  ⚠️  Offer is completed but acceptedTradeId still points to this trade')
      console.log('  This is preventing the item from being deleted')
      console.log('\n  Solution: When an offer is marked as completed, we should clear acceptedTradeId')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the check
checkOfferStatus()