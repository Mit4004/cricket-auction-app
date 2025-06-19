import { type NextRequest, NextResponse } from "next/server"
import gameStateManager, { authenticateUser } from "@/lib/game-state"

export async function POST(request: NextRequest) {
  console.log("Start auction API called")

  try {
    const body = await request.json()
    const { adminPin } = body

    if (!authenticateUser("admin", adminPin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = gameStateManager.startAuction()

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    console.log("Auction started successfully")
    return NextResponse.json(result.gameState)
  } catch (error) {
    console.error("Start auction error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
