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
  timerPaused: boolean
  timeRemaining: number
  auctionActive: boolean
  auctionEnded: boolean
  auctionStarted: boolean
  preAuctionTimer: number
  preAuctionActive: boolean
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
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

      {gameState.preAuctionActive ? (
        <div className="pre-auction-timer fade-in">
          <h2>🚀 Auction Starting Soon!</h2>
          <div className="pre-auction-countdown">{formatTime(gameState.preAuctionTimer)}</div>
          <p>Get ready! The auction will begin automatically when the timer reaches zero.</p>
          <div style={{ marginTop: "2rem", color: "#b0b0b0" }}>
            <p>Players ready: {gameState.players.length}</p>
          </div>
        </div>
      ) : !gameState.auctionActive || gameState.players.length === 0 ? (
        <div className="auction-status">
          <p>Waiting for auction to start...</p>
          <p style={{ color: "#4ecdc4", fontSize: "0.9rem" }}>🟢 Connected</p>
        </div>
      ) : gameState.auctionEnded ? (
        <div className="teams-display fade-in">
          <h2>🏆 Final Teams</h2>
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
              <div
                style={{
                  marginTop: "1rem",
                  padding: "1rem",
                  background: "rgba(78, 205, 196, 0.1)",
                  borderRadius: "8px",
                }}
              >
                <strong>
                  Total Spent: ₹
                  {gameState.captain1Team.reduce((sum, player) => sum + (player.soldPrice || 0), 0).toLocaleString()}
                </strong>
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
              <div
                style={{
                  marginTop: "1rem",
                  padding: "1rem",
                  background: "rgba(255, 107, 107, 0.1)",
                  borderRadius: "8px",
                }}
              >
                <strong>
                  Total Spent: ₹
                  {gameState.captain2Team.reduce((sum, player) => sum + (player.soldPrice || 0), 0).toLocaleString()}
                </strong>
              </div>
            </div>
          </div>
          <div
            style={{ marginTop: "2rem", padding: "1rem", background: "rgba(255, 255, 255, 0.05)", borderRadius: "8px" }}
          >
            <p style={{ color: "#ff6b6b", fontSize: "1.1rem" }}>
              🕒 Auction data will be automatically cleared in 25 seconds
            </p>
          </div>
        </div>
      ) : (
        <div className="main-display">
          <div className="player-showcase">
            <div className="player-card-large current-player-card">
              <div className="player-image">🏏</div>
              <div className="player-name">{currentPlayer?.name}</div>
              <div className="player-role">{currentPlayer?.role}</div>
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.5rem",
                  background: "rgba(0, 245, 255, 0.2)",
                  borderRadius: "8px",
                  border: "2px solid #00f5ff",
                }}
              >
                <strong style={{ color: "#00f5ff" }}>🎯 ON AUCTION</strong>
              </div>
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
                    animation: gameState.timeRemaining <= 10 ? "pulse 0.5s infinite" : "none",
                  }}
                >
                  {gameState.timeRemaining}
                </div>
              </div>
              <p>
                seconds remaining
                {gameState.timerPaused && (
                  <span style={{ color: "#f39c12", display: "block", fontSize: "0.9rem" }}>⏸️ PAUSED</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Live Stats */}
      {gameState.auctionActive && !gameState.auctionEnded && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginTop: "2rem",
          }}
        >
          <div
            style={{
              background: "rgba(78, 205, 196, 0.1)",
              padding: "1rem",
              borderRadius: "8px",
              border: "2px solid #4ecdc4",
              textAlign: "center",
            }}
          >
            <h4 style={{ color: "#4ecdc4" }}>⚡ Team Lightning</h4>
            <p>Balance: ₹{gameState.captain1Balance.toLocaleString()}</p>
            <p>Players: {gameState.captain1Team.length}</p>
          </div>
          <div
            style={{
              background: "rgba(255, 107, 107, 0.1)",
              padding: "1rem",
              borderRadius: "8px",
              border: "2px solid #ff6b6b",
              textAlign: "center",
            }}
          >
            <h4 style={{ color: "#ff6b6b" }}>🔥 Team Thunder</h4>
            <p>Balance: ₹{gameState.captain2Balance.toLocaleString()}</p>
            <p>Players: {gameState.captain2Team.length}</p>
          </div>
          <div
            style={{
              background: "rgba(0, 245, 255, 0.1)",
              padding: "1rem",
              borderRadius: "8px",
              border: "2px solid #00f5ff",
              textAlign: "center",
            }}
          >
            <h4 style={{ color: "#00f5ff" }}>📊 Progress</h4>
            <p>
              Player {gameState.currentPlayerIndex + 1} of {gameState.players.length}
            </p>
            <p>Remaining: {gameState.players.length - gameState.currentPlayerIndex - 1}</p>
          </div>
        </div>
      )}
    </div>
  )
}
