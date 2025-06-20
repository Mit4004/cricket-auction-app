import { Server } from "socket.io"
import gameStateManager from "./game-state.js"

let io = null

export function initializeWebSocket(server) {
  if (io) return io

  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id)

    // Send current game state immediately on connection
    socket.emit("gameStateUpdate", gameStateManager.getState())

    // Handle authentication
    socket.on("authenticate", (data) => {
      socket.userRole = data.role
      socket.userPin = data.pin
      console.log(`User authenticated: ${data.role}`)
    })

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id)
    })
  })

  return io
}

export function broadcastGameState() {
  if (io) {
    const gameState = gameStateManager.getState()
    io.emit("gameStateUpdate", gameState)
    console.log("Broadcasting game state update")
  }
}

export function getIO() {
  return io
}
