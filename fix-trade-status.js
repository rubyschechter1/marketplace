const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixTradeStatus(tradeId) {
  console.log(`\n🔧 Fixing trade status for: ${tradeId}\n`)
  
  try {
    // Get the trade details
    const trade = await prisma.proposedTrades.findUnique({
      where: { id: tradeId },
      include: {
        offer: true,
        reviews: true,
        offeredItem: {
          include: {
            currentOwner: true
          }
        },
        proposer: true
      }
    })
    
    if (!trade) {
      console.log('❌ Trade not found!')
      return
    }
    
    console.log('📋 Trade Details:')
    console.log(`  Status: ${trade.status}`)
    console.log(`  Offer Status: ${trade.offer.status}`)
    console.log(`  Number of Reviews: ${trade.reviews.length}`)
    console.log(`  Offered Item: ${trade.offeredItem?.name}`)
    console.log(`  Current Owner of Item: ${trade.offeredItem?.currentOwner?.firstName} ${trade.offeredItem?.currentOwner?.lastName}`)
    console.log(`  Proposer: ${trade.proposer.firstName} ${trade.proposer.lastName}`)
    
    // Check if the item has already been transferred
    const itemTransferred = trade.offeredItem && 
                           trade.offeredItem.currentOwnerId !== trade.proposerId
    
    console.log(`  Item Transferred: ${itemTransferred ? 'Yes' : 'No'}`)
    
    if (trade.status === 'accepted' && trade.offer.status === 'completed' && itemTransferred) {
      console.log('\n✅ This trade should be marked as completed!')
      console.log('   - Trade is accepted')
      console.log('   - Offer is completed')
      console.log('   - Item has been transferred')
      
      // Ask for confirmation
      console.log('\n⚠️  To fix this, run: node fix-trade-status.js --confirm')
      
      if (process.argv.includes('--confirm')) {
        console.log('\n🔄 Updating trade status to completed...')
        
        await prisma.proposedTrades.update({
          where: { id: tradeId },
          data: { 
            status: 'completed',
            updatedAt: new Date()
          }
        })
        
        console.log('✅ Trade status updated to completed!')
      }
    } else {
      console.log('\n❌ Trade does not meet criteria for automatic completion')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the fix
fixTradeStatus('9d33d370-489c-45ac-a314-a359cee72010')