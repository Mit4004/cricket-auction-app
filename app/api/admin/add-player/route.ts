import { type NextRequest, NextResponse } from "next/server"
import gameStateManager, { authenticateUser } from "@/lib/game-state"

export async function POST(request: NextRequest) {
  console.log("Add player API called")

  try {
    const body = await request.json()
    const { name, role, basePrice, adminPin } = body

    console.log("Admin PIN check:", { provided: adminPin })

    // Verify admin PIN
    if (!authenticateUser("admin", adminPin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const gameState = gameStateManager.addPlayer({ name, role, basePrice })
    console.log("Player added successfully:", { name, role, basePrice })
    console.log("Current players:", gameState.players)

    return NextResponse.json(gameState)
  } catch (error) {
    console.error("Add player error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
