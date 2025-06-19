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

export async function POST(request: NextRequest) {
  console.log("Place bid API called")

  try {
    const body = await request.json()
    const { amount, captain, captainPin } = body

    // Verify captain PIN
    const expectedPin =
      captain === "captain1" ? process.env.CAPTAIN1_PIN || "team1" : process.env.CAPTAIN2_PIN || "team2"

    console.log("Captain PIN check:", { captain, provided: captainPin, expected: expectedPin })

    if (captainPin !== expectedPin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const captainBalance = captain === "captain1" ? gameState.captain1Balance : gameState.captain2Balance

    if (amount > gameState.currentBid && amount <= captainBalance && gameState.timerActive) {
      gameState.currentBid = amount
      gameState.highestBidder = captain
      gameState.lastUpdate = Date.now()
      return NextResponse.json({ success: true, gameState })
    }

    return NextResponse.json({ success: false, gameState })
  } catch (error) {
    console.error("Place bid error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
