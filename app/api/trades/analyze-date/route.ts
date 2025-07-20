import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { analyzeConversationForExchangeDate, saveExchangeDate } from "@/lib/ai/date-extraction"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { proposedTradeId } = body

    if (!proposedTradeId) {
      return NextResponse.json(
        { error: "Missing proposedTradeId" },
        { status: 400 }
      )
    }

    // Analyze the conversation
    const result = await analyzeConversationForExchangeDate(proposedTradeId)
    
    // Save the result if a date was found
    await saveExchangeDate(proposedTradeId, result)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error analyzing trade date:", error)
    return NextResponse.json(
      { error: "Failed to analyze trade date" },
      { status: 500 }
    )
  }
}