import { type NextRequest, NextResponse } from "next/server"

// Shared gameState
const gameState = {
  players: [] as any[],
  currentPlayerIndex: 0,
  currentBid: 0,
  highestBidder: null,
  captain1Balance: 1000000,
  captain2Balance: 1000000,
  captain1Team: [] as any[],
  captain2Team: [] as any[],
  timerActive: false,
  timeRemaining: 60,
  auctionActive: false,
  auctionEnded: false,
  lastUpdate: Date.now(),
}

let timerInterval: NodeJS.Timeout | null = null

export async function POST(request: NextRequest) {
  console.log("End auction API called")

  try {
    const body = await request.json()
    const { adminPin } = body
    const expectedPin = process.env.ADMIN_PIN || "admin123"

    if (adminPin !== expectedPin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    gameState.auctionEnded = true
    gameState.auctionActive = false
    gameState.timerActive = false

    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }

    gameState.lastUpdate = Date.now()
    return NextResponse.json(gameState)
  } catch (error) {
    console.error("End auction error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
