import { type NextRequest, NextResponse } from "next/server"
import gameStateManager, { authenticateUser } from "@/lib/game-state"

export async function POST(request: NextRequest) {
  console.log("Start pre-auction timer API called")

  try {
    const body = await request.json()
    const { seconds, adminPin } = body

    if (!authenticateUser("admin", adminPin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!seconds || seconds < 1) {
      return NextResponse.json({ error: "Invalid timer duration" }, { status: 400 })
    }

    const result = gameStateManager.startPreAuctionTimer(seconds)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    console.log("Pre-auction timer started successfully")
    return NextResponse.json(result.gameState)
  } catch (error) {
    console.error("Start pre-auction timer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
