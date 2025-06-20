import { type NextRequest, NextResponse } from "next/server"
import gameStateManager, { authenticateUser } from "@/lib/game-state"

export async function POST(request: NextRequest) {
  try {
    const { adminPin } = await request.json()

    if (!authenticateUser("admin", adminPin)) {
      return NextResponse.json({ error: "Invalid admin PIN" }, { status: 401 })
    }

    const gameState = gameStateManager.clearData()
    return NextResponse.json({ success: true, gameState })
  } catch (error) {
    console.error("Error clearing data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
