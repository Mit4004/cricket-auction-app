"use client"

import { useEffect, useState } from "react"

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
  lastUpdate: number
}

export default function SpectatorPage() {
  const [gameState, setGameState] = useState<GameState | null>(null)

  useEffect(() => {
    fetchGameState()

    // Poll for updates every 1 second
    const interval = setInterval(fetchGameState, 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchGameState = async () => {
    try {
      const response = await fetch("/api/game-state")
      const data = await response.json()
      setGameState(data)
    } catch (error) {
      console.error("Error fetching game state:", error)
    }
  }

  if (!gameState) {
    return (
      <div className="container">
        <div className="header">
          <h1 className="title">Loading...</h1>
        </div>
      </div>
    )
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
          <p style={{ color: "#4ecdc4", fontSize: "0.9rem" }}>🟢 Connected</p>
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
            <div className="player-card-large">
              <div className="player-image">🏏</div>
              <div className="player-name">{currentPlayer?.name}</div>
              <div className="player-role">{currentPlayer?.role}</div>
            </div>
          </div>

          <div className="bid-info">
            <div className="current-bid-display">
              <h2>Current Highest Bid</h2>
              <div className="bid-amount-large">₹{gameState.currentBid.toLocaleString()}</div>
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
