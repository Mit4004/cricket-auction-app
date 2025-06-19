import { NextResponse } from "next/server"
import gameStateManager from "@/lib/game-state"

export async function GET() {
  console.log("Game state API called")
  const gameState = gameStateManager.getState()
  return NextResponse.json(gameState)
}
