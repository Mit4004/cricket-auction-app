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
  console.log("Next player API called")

  try {
    const body = await request.json()
    const { adminPin } = body
    const expectedPin = process.env.ADMIN_PIN || "admin123"

    if (adminPin !== expectedPin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Assign current player if there's a bid
    if (gameState.highestBidder && gameState.currentBid > 0) {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex]
      currentPlayer.soldTo = gameState.highestBidder
      currentPlayer.soldPrice = gameState.currentBid

      if (gameState.highestBidder === "captain1") {
        gameState.captain1Team.push(currentPlayer)
        gameState.captain1Balance -= gameState.currentBid
      } else {
        gameState.captain2Team.push(currentPlayer)
        gameState.captain2Balance -= gameState.currentBid
      }
    }

    // Move to next player
    gameState.currentPlayerIndex++
    gameState.currentBid = 0
    gameState.highestBidder = null
    gameState.timerActive = false
    gameState.timeRemaining = 60

    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }

    if (gameState.currentPlayerIndex >= gameState.players.length) {
      // End auction
      gameState.auctionEnded = true
      gameState.auctionActive = false
      gameState.timerActive = false
    }

    gameState.lastUpdate = Date.now()
    return NextResponse.json(gameState)
  } catch (error) {
    console.error("Next player error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
