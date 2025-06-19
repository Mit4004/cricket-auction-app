import { type NextRequest, NextResponse } from "next/server"

// Authentication
const PINS = {
  admin: process.env.ADMIN_PIN || "admin123",
  captain1: process.env.CAPTAIN1_PIN || "team1",
  captain2: process.env.CAPTAIN2_PIN || "team2",
}

function authenticateUser(role: string, pin: string) {
  console.log("Authenticating:", { role, pin, expectedPin: PINS[role as keyof typeof PINS] })
  if (role === "spectator") return true
  const isValid = PINS[role as keyof typeof PINS] && PINS[role as keyof typeof PINS] === pin
  console.log("Authentication result:", isValid)
  return isValid
}

export async function POST(request: NextRequest) {
  console.log("Auth API called")

  try {
    const body = await request.json()
    console.log("Request body:", body)

    const { role, pin } = body

    if (!role || !pin) {
      console.log("Missing role or pin:", { role, pin })
      return NextResponse.json({ success: false, error: "Role and PIN are required" }, { status: 400 })
    }

    const authenticated = authenticateUser(role, pin)
    console.log("Authentication result:", authenticated)

    if (authenticated) {
      return NextResponse.json({ success: true, role })
    } else {
      return NextResponse.json({ success: false, error: "Invalid PIN" })
    }
  } catch (error) {
    console.error("Auth API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
