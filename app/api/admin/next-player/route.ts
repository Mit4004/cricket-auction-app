import { type NextRequest, NextResponse } from "next/server"
import gameStateManager, { authenticateUser } from "@/lib/game-state"

export async function POST(request: NextRequest) {
  console.log("Next player API called")

  try {
    const body = await request.json()
    const { adminPin } = body

    if (!authenticateUser("admin", adminPin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const gameState = gameStateManager.nextPlayer()
    console.log("Moved to next player successfully")

    return NextResponse.json(gameState)
  } catch (error) {
    console.error("Next player error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
