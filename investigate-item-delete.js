const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function investigateItem(itemId) {
  console.log(`\n🔍 Investigating item: ${itemId}\n`)
  
  try {
    // Get the item details
    const item = await prisma.items.findUnique({
      where: { id: itemId },
      include: {
        currentOwner: true
      }
    })
    
    if (!item) {
      console.log('❌ Item not found!')
      return
    }
    
    console.log('📦 Item Details:')
    console.log(`  Name: ${item.name}`)
    console.log(`  Current Owner: ${item.currentOwner.firstName} ${item.currentOwner.lastName}`)
    console.log(`  Available: ${item.isAvailable}`)
    
    // Check if item is part of any offers
    const offers = await prisma.offers.findMany({
      where: { itemId: itemId },
      include: {
        acceptedTrade: true,
        proposedTrades: {
          include: {
            offer: {
              select: {
                acceptedTradeId: true
              }
            }
          }
        }
      }
    })
    
    console.log(`\n📋 Offers with this item: ${offers.length}`)
    
    for (const offer of offers) {
      console.log(`\n  Offer: ${offer.title} (${offer.id})`)
      console.log(`    Status: ${offer.status}`)
      console.log(`    AcceptedTradeId: ${offer.acceptedTradeId}`)
      console.log(`    Number of proposed trades: ${offer.proposedTrades.length}`)
      
      for (const trade of offer.proposedTrades) {
        console.log(`\n    Trade ${trade.id}:`)
        console.log(`      Status (old field): ${trade.status}`)
        console.log(`      isRejected: ${trade.isRejected}`)
        console.log(`      isWithdrawn: ${trade.isWithdrawn}`)
        console.log(`      Is this the accepted trade?: ${trade.offer.acceptedTradeId === trade.id}`)
      }
    }
    
    // Check if item is offered in any trades
    const tradesAsOfferedItem = await prisma.proposedTrades.findMany({
      where: { offeredItemId: itemId },
      include: {
        offer: {
          select: {
            id: true,
            title: true,
            status: true,
            acceptedTradeId: true
          }
        }
      }
    })
    
    console.log(`\n🤝 Trades where this item is offered: ${tradesAsOfferedItem.length}`)
    
    for (const trade of tradesAsOfferedItem) {
      console.log(`\n  Trade ${trade.id}:`)
      console.log(`    For offer: ${trade.offer.title} (${trade.offer.id})`)
      console.log(`    Trade status (old field): ${trade.status}`)
      console.log(`    isRejected: ${trade.isRejected}`)
      console.log(`    isWithdrawn: ${trade.isWithdrawn}`)
      console.log(`    Offer's acceptedTradeId: ${trade.offer.acceptedTradeId}`)
      console.log(`    Is this the accepted trade?: ${trade.offer.acceptedTradeId === trade.id}`)
    }
    
    // Now let's check what the delete validation logic would find
    console.log('\n🔍 What the delete validation finds:')
    
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
            acceptedTradeId: true
          }
        }
      }
    })
    
    console.log(`\nActive trades (not rejected/withdrawn): ${activeTrades.length}`)
    
    const hasAcceptedTrade = activeTrades.some(trade => 
      trade.offer.acceptedTradeId === trade.id
    )
    
    const hasPendingTrade = activeTrades.some(trade => 
      !trade.offer.acceptedTradeId || trade.offer.acceptedTradeId === trade.id
    )
    
    console.log(`Has accepted trade: ${hasAcceptedTrade}`)
    console.log(`Has pending trade: ${hasPendingTrade}`)
    
    if (hasAcceptedTrade) {
      console.log('\n❌ Item cannot be deleted - part of an accepted trade')
      const acceptedTrades = activeTrades.filter(trade => 
        trade.offer.acceptedTradeId === trade.id
      )
      for (const trade of acceptedTrades) {
        console.log(`  Accepted trade: ${trade.id}`)
      }
    } else if (hasPendingTrade) {
      console.log('\n❌ Item cannot be deleted - part of pending trades')
    } else {
      console.log('\n✅ Item should be deletable')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the investigation
investigateItem('bd72a73b-8356-452a-8a63-fc8d948be33d')