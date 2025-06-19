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
  console.log("Start timer API called")

  try {
    const body = await request.json()
    const { adminPin } = body
    const expectedPin = process.env.ADMIN_PIN || "admin123"

    if (adminPin !== expectedPin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (gameState.timerActive || gameState.players.length === 0) {
      return NextResponse.json(gameState)
    }

    gameState.timerActive = true
    gameState.auctionActive = true
    gameState.timeRemaining = 60
    gameState.lastUpdate = Date.now()

    // Start countdown
    if (timerInterval) clearInterval(timerInterval)
    timerInterval = setInterval(() => {
      gameState.timeRemaining--
      gameState.lastUpdate = Date.now()

      if (gameState.timeRemaining <= 0) {
        clearInterval(timerInterval!)
        timerInterval = null
        gameState.timerActive = false

        // Auto-assign player to highest bidder
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
        gameState.lastUpdate = Date.now()
      }
    }, 1000)

    return NextResponse.json(gameState)
  } catch (error) {
    console.error("Start timer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
