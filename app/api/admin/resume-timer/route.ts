import { type NextRequest, NextResponse } from "next/server"
import gameStateManager, { authenticateUser } from "@/lib/game-state"

export async function POST(request: NextRequest) {
  console.log("Resume timer API called")

  try {
    const body = await request.json()
    const { adminPin } = body

    if (!authenticateUser("admin", adminPin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const gameState = gameStateManager.resumeTimer()
    console.log("Timer resumed successfully")

    return NextResponse.json(gameState)
  } catch (error) {
    console.error("Resume timer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
