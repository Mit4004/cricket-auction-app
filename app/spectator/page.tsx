"use client"

import { useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"

let socket: Socket

interface Player {
  id: number
  name: string
  role: string
  soldTo?: string
  soldPrice?: number
}

interface GameState {
  players: Player[]
  currentPlayerIndex: number
  currentBid: number
  highestBidder: string | null
  captain1Balance: number
  captain2Balance: number
  captain1Team: Player[]
  captain2Team: Player[]
  timerActive: boolean
  timeRemaining: number
  auctionActive: boolean
  auctionEnded: boolean
}

export default function SpectatorPage() {
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    currentPlayerIndex: 0,
    currentBid: 0,
    highestBidder: null,
    captain1Balance: 1000000,
    captain2Balance: 1000000,
    captain1Team: [],
    captain2Team: [],
    timerActive: false,
    timeRemaining: 60,
    auctionActive: false,
    auctionEnded: false,
  })

  useEffect(() => {
    socketInitializer()
    return () => {
      if (socket) socket.disconnect()
    }
  }, [])

  const socketInitializer = async () => {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "", {
      path: "/api/socket",
      addTrailingSlash: false,
    })

    socket.emit("authenticate", { role: "spectator", pin: "" })

    socket.on("gameState", (state: GameState) => {
      setGameState(state)
    })

    socket.on("timerUpdate", (timeRemaining: number) => {
      setGameState((prev) => ({ ...prev, timeRemaining }))
    })

    socket.on("newBid", (bidData: { amount: number; captain: string }) => {
      // Visual feedback for new bids
      const bidElement = document.getElementById("currentBid")
      if (bidElement) {
        bidElement.style.animation = "pulse 0.5s ease-in-out"
        setTimeout(() => {
          bidElement.style.animation = ""
        }, 500)
      }
    })

    socket.on("nextPlayer", (player: Player) => {
      // Card transition animation
      const playerCard = document.getElementById("playerCard")
      if (playerCard) {
        playerCard.style.animation = "slideIn 0.5s ease-out"
        setTimeout(() => {
          playerCard.style.animation = ""
        }, 500)
      }
    })
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex]

  return (
    <div className="spectator-container">
      <div className="spectator-header">
        <h1>🏏 LIVE CRICKET AUCTION</h1>
        <div className="live-indicator">
          <span className="live-dot"></span>
          LIVE
        </div>
      </div>

      {!gameState.auctionActive || gameState.players.length === 0 ? (
        <div className="auction-status">
          <p>Waiting for auction to start...</p>
        </div>
      ) : gameState.auctionEnded ? (
        <div className="teams-display">
          <h2>Final Teams</h2>
          <div className="teams-grid">
            <div className="team-section">
              <h3>⚡ Team Lightning</h3>
              <div className="team-list">
                {gameState.captain1Team.map((player) => (
                  <div key={player.id} className="team-player">
                    <div className="team-player-name">{player.name}</div>
                    <div className="team-player-role">{player.role}</div>
                    <div className="team-player-price">₹{player.soldPrice?.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="team-section">
              <h3>🔥 Team Thunder</h3>
              <div className="team-list">
                {gameState.captain2Team.map((player) => (
                  <div key={player.id} className="team-player">
                    <div className="team-player-name">{player.name}</div>
                    <div className="team-player-role">{player.role}</div>
                    <div className="team-player-price">₹{player.soldPrice?.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="main-display">
          <div className="player-showcase">
            <div className="player-card-large" id="playerCard">
              <div className="player-image">🏏</div>
              <div className="player-name">{currentPlayer?.name}</div>
              <div className="player-role">{currentPlayer?.role}</div>
            </div>
          </div>

          <div className="bid-info">
            <div className="current-bid-display">
              <h2>Current Highest Bid</h2>
              <div className="bid-amount-large" id="currentBid">
                ₹{gameState.currentBid.toLocaleString()}
              </div>
              <div className="bidder-info">
                {gameState.highestBidder
                  ? `Leading: ${gameState.highestBidder === "captain1" ? "Team Lightning ⚡" : "Team Thunder 🔥"}`
                  : "No bids yet"}
              </div>
            </div>

            <div className="timer-display-large">
              <div className="timer-circle">
                <div
                  className="timer-number"
                  style={{
                    color: gameState.timeRemaining <= 10 ? "#ff4444" : "#ff6b6b",
                  }}
                >
                  {gameState.timeRemaining}
                </div>
              </div>
              <p>seconds remaining</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
