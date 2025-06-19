import { NextResponse } from "next/server"

// In-memory game state
const gameState = {
  players: [],
  currentPlayerIndex: 0,
  currentBid: 0,
  highestBidder: null,
  captain1Balance: 1000000,
  captain2Balance: 1000000,
  captain1Team: [],
  captain2Team: [],
  timerActive: false,
  timeRemaining: 60,
  auctionActive: false,
  auctionEnded: false,
  lastUpdate: Date.now(),
}

export async function GET() {
  console.log("Game state API called")
  return NextResponse.json(gameState)
}

// Export the gameState for other API routes to use
export { gameState }
