import { type NextRequest, NextResponse } from "next/server"
import gameStateManager, { authenticateUser } from "@/lib/game-state"

export async function POST(request: NextRequest) {
  console.log("Place bid API called")

  try {
    const body = await request.json()
    const { amount, captain, captainPin } = body

    // Verify captain PIN
    if (!authenticateUser(captain, captainPin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = gameStateManager.placeBid(amount, captain)
    console.log("Bid placement result:", result.success)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Place bid error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
