const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkInventories() {
  const rubyId = '3fa8ca6e-ea8a-4c68-9bc6-1f3b8cc303c8'
  const badLarryId = '02b2533d-7471-449a-972f-92641ec83496'
  const itemId = 'f8026a89-1c70-4c2a-8770-7e8258d9aeef'
  
  console.log('=== CHECKING INVENTORIES ===\n')
  
  // Check Ruby's inventory
  console.log("RUBY'S INVENTORY:")
  const rubyItems = await prisma.items.findMany({
    where: { currentOwnerId: rubyId },
    select: { id: true, name: true, isAvailable: true }
  })
  rubyItems.forEach(item => {
    console.log(`- ${item.name} (${item.id}) - Available: ${item.isAvailable}`)
  })
  
  // Check Bad Larry's inventory
  console.log("\n\nBAD LARRY'S INVENTORY:")
  const badLarryItems = await prisma.items.findMany({
    where: { currentOwnerId: badLarryId },
    select: { id: true, name: true, isAvailable: true }
  })
  badLarryItems.forEach(item => {
    console.log(`- ${item.name} (${item.id}) - Available: ${item.isAvailable}`)
  })
  
  // Check the specific item details
  console.log("\n\nSPECIFIC ITEM DETAILS (Punkt MP 02):")
  const punktItem = await prisma.items.findUnique({
    where: { id: itemId },
    include: {
      currentOwner: true,
      history: {
        include: {
          fromOwner: true,
          toOwner: true,
          trade: true
        },
        orderBy: { transferDate: 'asc' }
      }
    }
  })
  
  console.log(`Item: ${punktItem.name}`)
  console.log(`Current Owner: ${punktItem.currentOwner.firstName} ${punktItem.currentOwner.lastName} (${punktItem.currentOwnerId})`)
  console.log(`Available: ${punktItem.isAvailable}`)
  
  console.log("\nITEM HISTORY:")
  punktItem.history.forEach(h => {
    console.log(`\n${h.transferDate.toISOString()}`)
    console.log(`From: ${h.fromOwner?.firstName} ${h.fromOwner?.lastName || '(initial owner)'}`)
    console.log(`To: ${h.toOwner.firstName} ${h.toOwner.lastName}`)
    console.log(`Trade ID: ${h.tradeId || 'N/A'}`)
    console.log(`Method: ${h.transferMethod}`)
  })
  
  await prisma.$disconnect()
}

checkInventories().catch(console.error)