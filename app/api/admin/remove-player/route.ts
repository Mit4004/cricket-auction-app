import { type NextRequest, NextResponse } from "next/server"
import gameStateManager, { authenticateUser } from "@/lib/game-state"

export async function POST(request: NextRequest) {
  console.log("Remove player API called")

  try {
    const body = await request.json()
    const { playerId, adminPin } = body

    if (!authenticateUser("admin", adminPin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const gameState = gameStateManager.removePlayer(playerId)
    console.log("Player removed successfully:", playerId)

    return NextResponse.json(gameState)
  } catch (error) {
    console.error("Remove player error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
