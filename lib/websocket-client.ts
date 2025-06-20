"use client"

import { useEffect, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"

interface GameState {
  players: any[]
  currentPlayerIndex: number
  currentBid: number
  highestBidder: string | null
  captain1Balance: number
  captain2Balance: number
  captain1Team: any[]
  captain2Team: any[]
  timerActive: boolean
  timerPaused: boolean
  timeRemaining: number
  auctionActive: boolean
  auctionEnded: boolean
  auctionStarted: boolean
  preAuctionTimer: number
  preAuctionActive: boolean
  auctionRound: number
  lastUpdate: number
}

export function useWebSocket(userRole?: string, userPin?: string) {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io({
      transports: ["websocket", "polling"],
    })

    const socket = socketRef.current

    socket.on("connect", () => {
      console.log("Connected to WebSocket server")
      setIsConnected(true)

      // Authenticate if credentials provided
      if (userRole && userPin) {
        socket.emit("authenticate", { role: userRole, pin: userPin })
      }
    })

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server")
      setIsConnected(false)
    })

    socket.on("gameStateUpdate", (newGameState: GameState) => {
      console.log("Received game state update")
      setGameState(newGameState)
    })

    socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error)
      setIsConnected(false)
    })

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [userRole, userPin])

  // Fallback to polling if WebSocket fails
  useEffect(() => {
    let pollInterval: NodeJS.Timeout

    if (!isConnected) {
      console.log("WebSocket not connected, falling back to polling")

      const fetchGameState = async () => {
        try {
          const response = await fetch("/api/game-state")
          const data = await response.json()
          setGameState(data)
        } catch (error) {
          console.error("Error fetching game state:", error)
        }
      }

      fetchGameState() // Initial fetch
      pollInterval = setInterval(fetchGameState, 3000) // Poll every 3 seconds as fallback
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [isConnected])

  return {
    gameState,
    isConnected,
    socket: socketRef.current,
  }
}
