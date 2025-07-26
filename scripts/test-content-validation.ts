#!/usr/bin/env tsx
import { validateContent } from '../lib/contentValidation'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testContentValidation() {
  console.log('Testing AI-based content validation...\n')

  const testCases = [
    // Currency/money tests
    { text: "Selling my bike for $100", context: "offer" as const, shouldPass: false },
    { text: "Looking to trade for cash", context: "offer" as const, shouldPass: false },
    { text: "Will pay 50 euros", context: "message" as const, shouldPass: false },
    { text: "This costs nothing, just a trade", context: "offer" as const, shouldPass: false },
    { text: "My phone charger is broken", context: "offer" as const, shouldPass: true },
    { text: "Looking for travel tips", context: "offer" as const, shouldPass: true },
    
    // Inappropriate content tests
    { text: "fuck this shit", context: "message" as const, shouldPass: false },
    { text: "Looking for weed or drugs", context: "offer" as const, shouldPass: false },
    { text: "kill yourself", context: "message" as const, shouldPass: false },
    
    // Normal content tests
    { text: "Blue backpack in good condition", context: "offer" as const, shouldPass: true },
    { text: "Thanks for the trade!", context: "message" as const, shouldPass: true },
    { text: "I love traveling and meeting new people", context: "profile" as const, shouldPass: true },
    { text: "Looking for hiking boots size 42", context: "offer" as const, shouldPass: true },
  ]

  let passed = 0
  let failed = 0

  for (const testCase of testCases) {
    try {
      const result = await validateContent(testCase.text, "Test field", testCase.context)
      const testPassed = result.isValid === testCase.shouldPass
      
      if (testPassed) {
        console.log(`✅ PASS: "${testCase.text}"`)
        passed++
      } else {
        console.log(`❌ FAIL: "${testCase.text}"`)
        console.log(`   Expected: ${testCase.shouldPass ? 'valid' : 'invalid'}`)
        console.log(`   Got: ${result.isValid ? 'valid' : 'invalid'}`)
        if (result.error) {
          console.log(`   Error: ${result.error}`)
        }
        failed++
      }
    } catch (error) {
      console.log(`❌ ERROR: "${testCase.text}"`)
      console.log(`   ${error}`)
      failed++
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`)
}

// Run the tests
testContentValidation().catch(console.error)