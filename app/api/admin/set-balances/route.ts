import { type NextRequest, NextResponse } from "next/server"
import gameStateManager, { authenticateUser } from "@/lib/game-state"

export async function POST(request: NextRequest) {
  console.log("Set balances API called")

  try {
    const body = await request.json()
    const { captain1, captain2, adminPin } = body

    console.log("Setting balances:", { captain1, captain2 })

    if (!authenticateUser("admin", adminPin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const gameState = gameStateManager.setBalances({ captain1, captain2 })
    console.log("Balances updated successfully:", { captain1, captain2 })

    return NextResponse.json(gameState)
  } catch (error) {
    console.error("Set balances error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
