import { type NextRequest, NextResponse } from "next/server"

// Shared gameState - in a real app, you'd use a database
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

export async function POST(request: NextRequest) {
  console.log("Set balances API called")

  try {
    const body = await request.json()
    const { captain1, captain2, adminPin } = body
    const expectedPin = process.env.ADMIN_PIN || "admin123"

    if (adminPin !== expectedPin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    gameState.captain1Balance = captain1
    gameState.captain2Balance = captain2
    gameState.lastUpdate = Date.now()

    return NextResponse.json(gameState)
  } catch (error) {
    console.error("Set balances error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
