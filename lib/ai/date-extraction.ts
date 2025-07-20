import Anthropic from '@anthropic-ai/sdk'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface DateExtractionResult {
  exchangeDate: Date | null
  confidence: 'high' | 'medium' | 'low' | 'none'
  extractedFrom: string | null
}

export async function analyzeConversationForExchangeDate(
  proposedTradeId: string
): Promise<DateExtractionResult> {
  try {
    // Fetch all messages for this trade conversation
    const messages = await prisma.messages.findMany({
      where: { proposedTradeId },
      include: {
        sender: {
          select: {
            firstName: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    if (messages.length === 0) {
      return {
        exchangeDate: null,
        confidence: 'none',
        extractedFrom: null
      }
    }

    // Format messages for AI analysis
    const conversationText = messages.map(msg => {
      const senderName = msg.sender?.firstName || 'System'
      return `${senderName}: ${msg.content}`
    }).join('\n')

    // Call Anthropic to analyze the conversation
    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 200,
      temperature: 0.1,
      system: `You are analyzing a conversation between two people arranging a trade/exchange. 
Your task is to identify when they plan to meet for the exchange.

Look for:
- Specific dates and times (e.g., "tomorrow at 3pm", "July 15th", "next Tuesday")
- Relative time references that can be converted to dates
- Meeting location arrangements that include timing

If multiple dates are mentioned, choose the LATEST one as the actual exchange date.
If they haven't decided on a specific date yet, return null for exchangeDate.

Current date/time for reference: ${new Date().toISOString()}

You must return a valid JSON object with:
{
  "exchangeDate": "ISO date string or null",
  "confidence": "high/medium/low/none",
  "extractedFrom": "quote from conversation showing the date agreement or null"
}`,
      messages: [
        {
          role: "user",
          content: conversationText
        }
      ]
    })

    const result = JSON.parse(message.content[0].type === 'text' ? message.content[0].text : '{}')
    
    // Parse the date if it exists
    let parsedDate: Date | null = null
    if (result.exchangeDate) {
      parsedDate = new Date(result.exchangeDate)
      // Validate the date
      if (isNaN(parsedDate.getTime())) {
        parsedDate = null
      }
    }

    return {
      exchangeDate: parsedDate,
      confidence: result.confidence || 'none',
      extractedFrom: result.extractedFrom || null
    }
  } catch (error) {
    console.error('Error analyzing conversation for date:', error)
    return {
      exchangeDate: null,
      confidence: 'none',
      extractedFrom: null
    }
  }
}

export async function saveExchangeDate(
  proposedTradeId: string,
  result: DateExtractionResult
): Promise<void> {
  if (!result.exchangeDate || result.confidence === 'none') {
    return
  }

  try {
    await prisma.tradeExchangeDates.upsert({
      where: { proposedTradeId },
      create: {
        proposedTradeId,
        extractedDate: result.exchangeDate,
        extractionMethod: 'ai'
      },
      update: {
        extractedDate: result.exchangeDate,
        extractionMethod: 'ai',
        updatedAt: new Date()
      }
    })
  } catch (error) {
    console.error('Error saving exchange date:', error)
  }
}