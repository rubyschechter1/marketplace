const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function investigateTrade() {
  const offerId = '0f962bae-1cea-4289-97ff-2584519252b0'
  const proposedTradeId = '80092762-1269-4e94-847e-0d948dbf207c'
  
  console.log('=== INVESTIGATING TRADE ===\n')
  
  // 1. Get the offer details
  console.log('1. OFFER DETAILS:')
  const offer = await prisma.offers.findUnique({
    where: { id: offerId },
    include: {
      traveler: true,
      item: true
    }
  })
  console.log(`Offer ID: ${offer.id}`)
  console.log(`Type: ${offer.type}`)
  console.log(`Status: ${offer.status}`)
  console.log(`Offer Owner: ${offer.traveler.firstName} ${offer.traveler.lastName} (${offer.traveler.id})`)
  console.log(`Item: ${offer.item?.name || 'No item'}`)
  console.log(`Item ID: ${offer.itemId}`)
  console.log(`Accepted Trade ID: ${offer.acceptedTradeId}`)
  
  // 2. Get the proposed trade details
  console.log('\n2. PROPOSED TRADE DETAILS:')
  const proposedTrade = await prisma.proposedTrades.findUnique({
    where: { id: proposedTradeId },
    include: {
      proposer: true,
      offeredItem: true
    }
  })
  console.log(`Proposed Trade ID: ${proposedTrade.id}`)
  console.log(`Proposer: ${proposedTrade.proposer.firstName} ${proposedTrade.proposer.lastName} (${proposedTrade.proposer.id})`)
  console.log(`Offered Item: ${proposedTrade.offeredItem?.name || 'No item (gift request)'}`)
  console.log(`Is Gift Mode: ${proposedTrade.isGiftMode}`)
  console.log(`Is Rejected: ${proposedTrade.isRejected}`)
  console.log(`Is Withdrawn: ${proposedTrade.isWithdrawn}`)
  
  // 3. Get the current item owner
  console.log('\n3. CURRENT ITEM OWNER:')
  if (offer.itemId) {
    const item = await prisma.items.findUnique({
      where: { id: offer.itemId },
      include: {
        currentOwner: true
      }
    })
    console.log(`Item: ${item.name}`)
    console.log(`Current Owner: ${item.currentOwner.firstName} ${item.currentOwner.lastName} (${item.currentOwner.id})`)
    console.log(`Item Status: ${item.status}`)
  }
  
  // 4. Check reviews to understand trade completion
  console.log('\n4. REVIEWS:')
  const reviews = await prisma.reviews.findMany({
    where: { proposedTradeId: proposedTradeId },
    include: {
      reviewer: true,
      reviewee: true
    }
  })
  
  reviews.forEach(review => {
    console.log(`\nReview ID: ${review.id}`)
    console.log(`Reviewer: ${review.reviewer.firstName} ${review.reviewer.lastName}`)
    console.log(`Reviewee: ${review.reviewee.firstName} ${review.reviewee.lastName}`)
    console.log(`Submitted At: ${review.submittedAt}`)
  })
  
  // 5. Get messages to understand the flow
  console.log('\n5. TRADE MESSAGES (System messages only):')
  const messages = await prisma.messages.findMany({
    where: { 
      offerId: offerId,
      proposedTradeId: proposedTradeId,
      senderId: null // System messages
    },
    orderBy: { createdAt: 'asc' }
  })
  
  messages.forEach(msg => {
    console.log(`\n${msg.createdAt.toISOString()}: ${msg.content}`)
  })
  
  await prisma.$disconnect()
}

investigateTrade().catch(console.error)