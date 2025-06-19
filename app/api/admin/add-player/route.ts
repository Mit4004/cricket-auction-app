import { type NextRequest, NextResponse } from "next/server"

// Import gameState from the game-state route
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
  console.log("Add player API called")

  try {
    const body = await request.json()
    const { name, role, adminPin } = body
    const expectedPin = process.env.ADMIN_PIN || "admin123"

    console.log("Admin PIN check:", { provided: adminPin, expected: expectedPin })

    // Verify admin PIN
    if (adminPin !== expectedPin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const newPlayer = {
      id: Date.now(),
      name,
      role,
    }

    gameState.players.push(newPlayer)
    gameState.lastUpdate = Date.now()

    return NextResponse.json(gameState)
  } catch (error) {
    console.error("Add player error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
