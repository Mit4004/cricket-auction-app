"use client"

import { useEffect, useState } from "react"

interface Player {
  id: number
  name: string
  role: string
  basePrice: number
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

export default function CaptainPage() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [bidAmount, setBidAmount] = useState("")
  const [userRole, setUserRole] = useState<string>("")
  const [captainPin, setCaptainPin] = useState("")

  useEffect(() => {
    const role = sessionStorage.getItem("userRole")
    const pin = sessionStorage.getItem("userPin")

    if (!role || (role !== "captain1" && role !== "captain2") || !pin) {
      window.location.href = "/"
      return
    }

    setUserRole(role)
    setCaptainPin(pin)
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

  const placeBid = async () => {
    const amount = Number.parseInt(bidAmount)

    if (!amount || amount <= 0) {
      alert("Please enter a valid bid amount")
      return
    }

    if (!gameState) return

    const currentBalance = userRole === "captain1" ? gameState.captain1Balance : gameState.captain2Balance
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    const minimumBid = Math.max(gameState.currentBid + 1, currentPlayer?.basePrice || 0)

    if (amount > currentBalance) {
      alert("Insufficient balance!")
      return
    }

    if (amount < minimumBid) {
      alert(`Bid must be at least ₹${minimumBid.toLocaleString()}`)
      return
    }

    if (!gameState.timerActive) {
      alert("Bidding is not active")
      return
    }

    if (gameState.timerPaused) {
      alert("Timer is paused - bidding not allowed")
      return
    }

    try {
      const response = await fetch("/api/captain/place-bid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount, captain: userRole, captainPin }),
      })

      const data = await response.json()

      if (data.success) {
        setBidAmount("")
        fetchGameState()
        showSuccessMessage("Bid placed successfully!")
      } else {
        alert("Error placing bid")
      }
    } catch (error) {
      console.error("Error placing bid:", error)
      alert("Error placing bid")
    }
  }

  const quickBid = (amount: number) => {
    if (!gameState) return
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    const minimumBid = Math.max(gameState.currentBid + 1, currentPlayer?.basePrice || 0)
    const newBid = Math.max(gameState.currentBid + amount, minimumBid)
    setBidAmount(newBid.toString())
  }

  const logout = () => {
    sessionStorage.removeItem("userRole")
    sessionStorage.removeItem("userPin")
    window.location.href = "/"
  }

  const showSuccessMessage = (message: string) => {
    const notification = document.createElement("div")
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(45deg, #4ecdc4, #44a08d);
      color: white;
      padding: 1rem 2rem;
      border-radius: 8px;
      box-shadow: 0 0 20px rgba(78, 205, 196, 0.5);
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    `
    notification.textContent = message
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 3000)
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
  const currentBalance = userRole === "captain1" ? gameState.captain1Balance : gameState.captain2Balance
  const myTeam = userRole === "captain1" ? gameState.captain1Team : gameState.captain2Team

  return (
    <div className="captain-container">
      <div className="captain-header">
        <h1>{userRole === "captain1" ? "⚡ Captain 1 - Team Lightning" : "🔥 Captain 2 - Team Thunder"}</h1>
        <div className="balance-display">
          <span>Balance: ₹{currentBalance.toLocaleString()}</span>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <span style={{ color: "#4ecdc4" }}>🟢 Connected</span>
          <button onClick={logout} className="btn-secondary">
            Logout
          </button>
        </div>
      </div>

      {gameState.preAuctionActive ? (
        <div className="pre-auction-timer fade-in">
          <h2>🚀 Auction Starting Soon!</h2>
          <div className="pre-auction-countdown">{formatTime(gameState.preAuctionTimer)}</div>
          <p>Get ready! The auction will begin automatically when the timer reaches zero.</p>
        </div>
      ) : !gameState.auctionActive || gameState.players.length === 0 ? (
        <div className="auction-status">
          <p>Waiting for auction to start...</p>
        </div>
      ) : gameState.auctionEnded ? (
        <div className="team-display fade-in">
          <h3>🏆 Your Final Team</h3>
          <div className="team-cards-grid">
            {myTeam.map((player) => (
              <div key={player.id} className="team-player-card">
                <div className="team-player-avatar">🏏</div>
                <div className="team-player-name">{player.name}</div>
                <div className="team-player-role">{player.role}</div>
                <div className="player-base-price">Base: ₹{player.basePrice?.toLocaleString()}</div>
                <div className="team-player-price">Sold: ₹{player.soldPrice?.toLocaleString()}</div>
              </div>
            ))}
            {myTeam.length === 0 && (
              <div style={{ padding: "2rem", textAlign: "center", color: "#b0b0b0", gridColumn: "1 / -1" }}>
                <h4>No Players Acquired</h4>
                <p>You didn't win any players in this auction</p>
              </div>
            )}
          </div>
          <div className="team-summary">
            <h4>Team Summary</h4>
            <p>Total Players: {myTeam.length}</p>
            <p>Total Spent: ₹{myTeam.reduce((sum, player) => sum + (player.soldPrice || 0), 0).toLocaleString()}</p>
            <p>Remaining Balance: ₹{currentBalance.toLocaleString()}</p>
          </div>

          {/* Show opponent's team summary */}
          <div
            className="opponent-summary"
            style={{
              marginTop: "2rem",
              padding: "1rem",
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "8px",
            }}
          >
            <h4>Opponent Team Summary</h4>
            {userRole === "captain1" ? (
              <>
                <p>🔥 Team Thunder: {gameState.captain2Team.length} players</p>
                <p>
                  Their Spending: ₹
                  {gameState.captain2Team.reduce((sum, player) => sum + (player.soldPrice || 0), 0).toLocaleString()}
                </p>
              </>
            ) : (
              <>
                <p>⚡ Team Lightning: {gameState.captain1Team.length} players</p>
                <p>
                  Their Spending: ₹
                  {gameState.captain1Team.reduce((sum, player) => sum + (player.soldPrice || 0), 0).toLocaleString()}
                </p>
              </>
            )}
          </div>

          <div
            style={{
              marginTop: "2rem",
              padding: "1rem",
              background: "rgba(78, 205, 196, 0.1)",
              borderRadius: "8px",
              textAlign: "center",
              border: "2px solid #4ecdc4",
            }}
          >
            <h4 style={{ color: "#4ecdc4" }}>🏆 Auction Complete!</h4>
            <p>{myTeam.length > 0 ? "Congratulations on building your team!" : "Better luck next time!"}</p>
          </div>
        </div>
      ) : (
        <div className="player-display">
          <div className="player-card current-player-card">
            <div className="player-image">🏏</div>
            <div className="player-name">{currentPlayer?.name}</div>
            <div className="player-role">{currentPlayer?.role}</div>
            <div className="player-base-price">Base Price: ₹{currentPlayer?.basePrice?.toLocaleString()}</div>
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

          <div className="bid-section">
            <div className="current-bid">
              <h3>Current Highest Bid</h3>
              <div className="bid-amount">₹{gameState.currentBid.toLocaleString()}</div>
              <div
                className="highest-bidder"
                style={{
                  color: gameState.highestBidder === userRole ? "#4ecdc4" : "#b0b0b0",
                  fontWeight: gameState.highestBidder === userRole ? "bold" : "normal",
                }}
              >
                {gameState.highestBidder
                  ? `Highest bidder: ${gameState.highestBidder === "captain1" ? "Captain 1 ⚡" : "Captain 2 🔥"}`
                  : `Starting at base price: ₹${currentPlayer?.basePrice?.toLocaleString()}`}
                {gameState.highestBidder === userRole && (
                  <span style={{ color: "#4ecdc4", display: "block" }}>🏆 YOU'RE WINNING!</span>
                )}
              </div>
            </div>

            <div className="timer-display">
              <div
                className="timer"
                style={{
                  color: gameState.timeRemaining <= 10 ? "#ff4444" : "#ff6b6b",
                  animation: gameState.timeRemaining <= 10 ? "pulse 0.5s infinite" : "none",
                }}
              >
                {gameState.timeRemaining}
              </div>
              <p>
                seconds remaining
                {gameState.timerPaused && (
                  <span style={{ color: "#f39c12", display: "block", fontSize: "0.9rem" }}>⏸️ PAUSED</span>
                )}
              </p>
            </div>

            <div className="bid-controls">
              <input
                type="number"
                className="bid-amount-input"
                placeholder={`Min bid: ₹${Math.max(gameState.currentBid + 1, currentPlayer?.basePrice || 0).toLocaleString()}`}
                min={Math.max(gameState.currentBid + 1, currentPlayer?.basePrice || 0)}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && placeBid()}
                disabled={!gameState.timerActive || gameState.timerPaused}
              />
              <button onClick={placeBid} className="btn-bid" disabled={!gameState.timerActive || gameState.timerPaused}>
                Place Bid
              </button>
            </div>

            <div className="quick-bids">
              <button
                onClick={() => quickBid(50000)}
                className="btn-quick"
                disabled={!gameState.timerActive || gameState.timerPaused}
              >
                +50K
              </button>
              <button
                onClick={() => quickBid(100000)}
                className="btn-quick"
                disabled={!gameState.timerActive || gameState.timerPaused}
              >
                +100K
              </button>
              <button
                onClick={() => quickBid(200000)}
                className="btn-quick"
                disabled={!gameState.timerActive || gameState.timerPaused}
              >
                +200K
              </button>
            </div>
          </div>
        </div>
      )}

      {/* My Team Summary */}
      {myTeam.length > 0 && !gameState.auctionEnded && (
        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "8px",
          }}
        >
          <h4>My Team ({myTeam.length} players)</h4>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
            {myTeam.map((player) => (
              <div
                key={player.id}
                style={{
                  background: "rgba(78, 205, 196, 0.1)",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  fontSize: "0.9rem",
                }}
              >
                {player.name} - ₹{player.soldPrice?.toLocaleString()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
