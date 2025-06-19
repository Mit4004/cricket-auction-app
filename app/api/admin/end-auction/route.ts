import { type NextRequest, NextResponse } from "next/server"
import gameStateManager, { authenticateUser } from "@/lib/game-state"

export async function POST(request: NextRequest) {
  console.log("End auction API called")

  try {
    const body = await request.json()
    const { adminPin } = body

    if (!authenticateUser("admin", adminPin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const gameState = gameStateManager.endAuction()
    console.log("Auction ended successfully")

    return NextResponse.json(gameState)
  } catch (error) {
    console.error("End auction error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
