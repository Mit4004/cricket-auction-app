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
  auctionRound: number
  lastUpdate: number
}

export default function AdminPage() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [playerName, setPlayerName] = useState("")
  const [playerRole, setPlayerRole] = useState("Batsman")
  const [playerBasePrice, setPlayerBasePrice] = useState(50000)
  const [captain1Balance, setCaptain1Balance] = useState(1000000)
  const [captain2Balance, setCaptain2Balance] = useState(1000000)
  const [preAuctionMinutes, setPreAuctionMinutes] = useState(5)
  const [adminPin, setAdminPin] = useState("")

  useEffect(() => {
    const userRole = sessionStorage.getItem("userRole")
    const userPin = sessionStorage.getItem("userPin")

    if (userRole !== "admin" || !userPin) {
      window.location.href = "/"
      return
    }

    setAdminPin(userPin)
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
      setCaptain1Balance(data.captain1Balance)
      setCaptain2Balance(data.captain2Balance)
    } catch (error) {
      console.error("Error fetching game state:", error)
    }
  }

  const addPlayer = async () => {
    if (!playerName.trim()) {
      alert("Please enter player name")
      return
    }

    if (playerBasePrice < 1000) {
      alert("Base price must be at least ₹1,000")
      return
    }

    try {
      const response = await fetch("/api/admin/add-player", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: playerName, role: playerRole, basePrice: playerBasePrice, adminPin }),
      })

      if (response.ok) {
        setPlayerName("")
        setPlayerBasePrice(50000)
        fetchGameState()
        showSuccessMessage("Player added successfully!")
      } else {
        alert("Error adding player")
      }
    } catch (error) {
      console.error("Error adding player:", error)
      alert("Error adding player")
    }
  }

  const removePlayer = async (playerId: number) => {
    if (gameState?.auctionActive) {
      alert("Cannot remove players during active auction")
      return
    }

    if (confirm("Are you sure you want to remove this player?")) {
      try {
        const response = await fetch("/api/admin/remove-player", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ playerId, adminPin }),
        })

        if (response.ok) {
          fetchGameState()
          showSuccessMessage("Player removed successfully!")
        } else {
          alert("Error removing player")
        }
      } catch (error) {
        console.error("Error removing player:", error)
        alert("Error removing player")
      }
    }
  }

  const setBalances = async () => {
    if (captain1Balance < 0 || captain2Balance < 0) {
      alert("Balances must be positive")
      return
    }

    try {
      const response = await fetch("/api/admin/set-balances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ captain1: captain1Balance, captain2: captain2Balance, adminPin }),
      })

      if (response.ok) {
        fetchGameState()
        showSuccessMessage("Balances updated successfully!")
      } else {
        alert("Error setting balances")
      }
    } catch (error) {
      console.error("Error setting balances:", error)
      alert("Error setting balances")
    }
  }

  const startPreAuctionTimer = async () => {
    if (!gameState || gameState.players.length === 0) {
      alert("Please add players first")
      return
    }

    const seconds = preAuctionMinutes * 60

    try {
      const response = await fetch("/api/admin/start-pre-auction-timer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ seconds, adminPin }),
      })

      if (response.ok) {
        fetchGameState()
        showSuccessMessage(`Pre-auction timer started for ${preAuctionMinutes} minutes!`)
      } else {
        const error = await response.json()
        alert(`Error starting pre-auction timer: ${error.error}`)
      }
    } catch (error) {
      console.error("Error starting pre-auction timer:", error)
      alert("Error starting pre-auction timer")
    }
  }

  const startAuction = async () => {
    if (!gameState || gameState.players.length === 0) {
      alert("Please add players first")
      return
    }

    try {
      const response = await fetch("/api/admin/start-auction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminPin }),
      })

      if (response.ok) {
        fetchGameState()
        showSuccessMessage("Auction started successfully!")
      } else {
        const error = await response.json()
        alert(`Error starting auction: ${error.error}`)
      }
    } catch (error) {
      console.error("Error starting auction:", error)
      alert("Error starting auction")
    }
  }

  const startTimer = async () => {
    if (!gameState?.auctionActive) {
      alert("Please start the auction first")
      return
    }

    try {
      const response = await fetch("/api/admin/start-timer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminPin }),
      })

      if (response.ok) {
        fetchGameState()
        showSuccessMessage("Timer started!")
      } else {
        alert("Error starting timer")
      }
    } catch (error) {
      console.error("Error starting timer:", error)
      alert("Error starting timer")
    }
  }

  const pauseTimer = async () => {
    try {
      const response = await fetch("/api/admin/pause-timer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminPin }),
      })

      if (response.ok) {
        fetchGameState()
        showSuccessMessage("Timer paused!")
      } else {
        alert("Error pausing timer")
      }
    } catch (error) {
      console.error("Error pausing timer:", error)
      alert("Error pausing timer")
    }
  }

  const resumeTimer = async () => {
    try {
      const response = await fetch("/api/admin/resume-timer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminPin }),
      })

      if (response.ok) {
        fetchGameState()
        showSuccessMessage("Timer resumed!")
      } else {
        alert("Error resuming timer")
      }
    } catch (error) {
      console.error("Error resuming timer:", error)
      alert("Error resuming timer")
    }
  }

  const stopTimer = async () => {
    try {
      const response = await fetch("/api/admin/stop-timer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminPin }),
      })

      if (response.ok) {
        fetchGameState()
        showSuccessMessage("Timer stopped!")
      } else {
        alert("Error stopping timer")
      }
    } catch (error) {
      console.error("Error stopping timer:", error)
      alert("Error stopping timer")
    }
  }

  const nextPlayer = async () => {
    try {
      const response = await fetch("/api/admin/next-player", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminPin }),
      })

      if (response.ok) {
        fetchGameState()
        showSuccessMessage("Moved to next player!")
      } else {
        alert("Error moving to next player")
      }
    } catch (error) {
      console.error("Error moving to next player:", error)
      alert("Error moving to next player")
    }
  }

  const endAuction = async () => {
    if (confirm("Are you sure you want to end the auction?")) {
      try {
        const response = await fetch("/api/admin/end-auction", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ adminPin }),
        })

        if (response.ok) {
          fetchGameState()
          showSuccessMessage("Auction ended!")
        } else {
          alert("Error ending auction")
        }
      } catch (error) {
        console.error("Error ending auction:", error)
        alert("Error ending auction")
      }
    }
  }

  const restartAuction = async () => {
    if (confirm("Are you sure you want to restart the auction? This will clear all data.")) {
      try {
        const response = await fetch("/api/admin/restart-auction", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ adminPin }),
        })

        if (response.ok) {
          fetchGameState()
          showSuccessMessage("Auction restarted successfully!")
        } else {
          alert("Error restarting auction")
        }
      } catch (error) {
        console.error("Error restarting auction:", error)
        alert("Error restarting auction")
      }
    }
  }

  const clearData = async () => {
    if (confirm("Are you sure you want to clear all auction data? This action cannot be undone.")) {
      try {
        const response = await fetch("/api/admin/clear-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ adminPin }),
        })

        if (response.ok) {
          fetchGameState()
          showSuccessMessage("All data cleared successfully!")
        } else {
          alert("Error clearing data")
        }
      } catch (error) {
        console.error("Error clearing data:", error)
        alert("Error clearing data")
      }
    }
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

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>👑 Admin Control Panel</h1>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <span style={{ color: "#4ecdc4" }}>🟢 Connected</span>
          <button onClick={logout} className="btn-secondary">
            Logout
          </button>
        </div>
      </div>

      {/* Pre-Auction Timer Display */}
      {gameState.preAuctionActive && (
        <div className="pre-auction-timer fade-in">
          <h2>🚀 Auction Starting Soon!</h2>
          <div className="pre-auction-countdown">{formatTime(gameState.preAuctionTimer)}</div>
          <p>Get ready! The auction will begin automatically when the timer reaches zero.</p>
        </div>
      )}

      {/* Auction Round Display */}
      {gameState.auctionActive && gameState.auctionRound > 1 && (
        <div className="auction-round-display fade-in" style={{ marginBottom: "2rem" }}>
          <h2>🔄 Round {gameState.auctionRound} - Unsold Players Re-Auction</h2>
          <p>Players who weren't sold in previous rounds are back for bidding!</p>
        </div>
      )}

      {/* Final Teams Display */}
      {gameState.auctionEnded && (
        <div className="teams-display fade-in" style={{ marginBottom: "2rem" }}>
          <h2>🏆 Final Teams</h2>
          <div className="teams-grid">
            <div className="team-section">
              <h3>⚡ Team Lightning</h3>
              <div className="team-cards-grid">
                {gameState.captain1Team.map((player) => (
                  <div key={player.id} className="team-player-card">
                    <div className="team-player-avatar">🏏</div>
                    <div className="team-player-name">{player.name}</div>
                    <div className="team-player-role">{player.role}</div>
                    <div className="player-base-price">Base: ₹{player.basePrice?.toLocaleString()}</div>
                    <div className="team-player-price">Sold: ₹{player.soldPrice?.toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <div className="team-summary">
                <h4>Team Summary</h4>
                <p>Total Players: {gameState.captain1Team.length}</p>
                <p>
                  Total Spent: ₹
                  {gameState.captain1Team.reduce((sum, player) => sum + (player.soldPrice || 0), 0).toLocaleString()}
                </p>
                <p>Remaining Balance: ₹{gameState.captain1Balance.toLocaleString()}</p>
              </div>
            </div>
            <div className="team-section">
              <h3>🔥 Team Thunder</h3>
              <div className="team-cards-grid">
                {gameState.captain2Team.map((player) => (
                  <div key={player.id} className="team-player-card">
                    <div className="team-player-avatar">🏏</div>
                    <div className="team-player-name">{player.name}</div>
                    <div className="team-player-role">{player.role}</div>
                    <div className="player-base-price">Base: ₹{player.basePrice?.toLocaleString()}</div>
                    <div className="team-player-price">Sold: ₹{player.soldPrice?.toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <div className="team-summary">
                <h4>Team Summary</h4>
                <p>Total Players: {gameState.captain2Team.length}</p>
                <p>
                  Total Spent: ₹
                  {gameState.captain2Team.reduce((sum, player) => sum + (player.soldPrice || 0), 0).toLocaleString()}
                </p>
                <p>Remaining Balance: ₹{gameState.captain2Balance.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div
            style={{
              marginTop: "2rem",
              padding: "1rem",
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <button onClick={clearData} className="btn-danger" style={{ padding: "1rem 2rem", fontSize: "1.1rem" }}>
              🗑️ Clear All Data
            </button>
            <p style={{ color: "#b0b0b0", fontSize: "0.9rem", marginTop: "1rem" }}>
              This will permanently delete all auction data and reset the system
            </p>
          </div>
        </div>
      )}

      <div className="admin-grid">
        {/* Player Management */}
        <div className="admin-section">
          <h3>Player Management</h3>
          <div className="form-group">
            <input
              type="text"
              placeholder="Player Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              disabled={gameState.auctionActive || gameState.preAuctionActive}
            />
            <select
              value={playerRole}
              onChange={(e) => setPlayerRole(e.target.value)}
              disabled={gameState.auctionActive || gameState.preAuctionActive}
            >
              <option value="Batsman">Batsman</option>
              <option value="Bowler">Bowler</option>
              <option value="All-Rounder">All-Rounder</option>
              <option value="Wicket-Keeper">Wicket-Keeper</option>
            </select>
            <label>Base Price (₹):</label>
            <input
              type="number"
              min="1000"
              step="1000"
              placeholder="Base Price"
              value={playerBasePrice}
              onChange={(e) => setPlayerBasePrice(Number(e.target.value))}
              disabled={gameState.auctionActive || gameState.preAuctionActive}
            />
            <button
              onClick={addPlayer}
              className="btn-primary"
              disabled={gameState.auctionActive || gameState.preAuctionActive}
            >
              Add Player
            </button>
          </div>
          <div className="players-list">
            {gameState.players.map((player, index) => (
              <div
                key={player.id}
                className={`player-item ${index === gameState.currentPlayerIndex && gameState.auctionActive ? "current-player" : ""}`}
                style={{
                  border:
                    index === gameState.currentPlayerIndex && gameState.auctionActive
                      ? "3px solid #00f5ff"
                      : "1px solid #333",
                  background:
                    index === gameState.currentPlayerIndex && gameState.auctionActive
                      ? "rgba(0, 245, 255, 0.1)"
                      : "rgba(255, 255, 255, 0.1)",
                }}
              >
                <div>
                  <strong>{player.name}</strong> - {player.role}
                  {index === gameState.currentPlayerIndex && gameState.auctionActive && (
                    <span style={{ color: "#00f5ff", fontWeight: "bold", marginLeft: "10px" }}>🎯 CURRENT</span>
                  )}
                  <br />
                  <small style={{ color: "#f39c12" }}>Base Price: ₹{player.basePrice?.toLocaleString()}</small>
                  <br />
                  <small>
                    {player.soldTo && player.soldTo !== "unsold"
                      ? `Sold to ${player.soldTo === "captain1" ? "Captain 1" : "Captain 2"} for ₹${player.soldPrice?.toLocaleString()}`
                      : index === gameState.currentPlayerIndex && gameState.auctionActive
                        ? "🔥 ON AUCTION"
                        : "Available"}
                  </small>
                </div>
                {!gameState.auctionActive && !gameState.preAuctionActive && (
                  <button
                    onClick={() => removePlayer(player.id)}
                    className="btn-danger"
                    style={{ marginLeft: "auto", padding: "0.5rem" }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Balance Management */}
        <div className="admin-section">
          <h3>Captain Balances</h3>
          <div className="form-group">
            <label>Captain 1 Balance:</label>
            <input
              type="number"
              value={captain1Balance}
              onChange={(e) => setCaptain1Balance(Number(e.target.value))}
              disabled={gameState.auctionActive || gameState.preAuctionActive}
            />
            <label>Captain 2 Balance:</label>
            <input
              type="number"
              value={captain2Balance}
              onChange={(e) => setCaptain2Balance(Number(e.target.value))}
              disabled={gameState.auctionActive || gameState.preAuctionActive}
            />
            <button
              onClick={setBalances}
              className="btn-primary"
              disabled={gameState.auctionActive || gameState.preAuctionActive}
            >
              Update Balances
            </button>
          </div>
        </div>

        {/* Pre-Auction Timer Controls */}
        <div className="admin-section">
          <h3>Pre-Auction Timer</h3>
          <div className="form-group">
            <label>Timer Duration (minutes):</label>
            <input
              type="number"
              min="1"
              max="60"
              value={preAuctionMinutes}
              onChange={(e) => setPreAuctionMinutes(Number(e.target.value))}
              disabled={gameState.preAuctionActive || gameState.auctionActive}
            />
            <button
              onClick={startPreAuctionTimer}
              className="btn-warning"
              disabled={gameState.preAuctionActive || gameState.auctionActive || gameState.players.length === 0}
            >
              Start Pre-Auction Timer
            </button>
          </div>
          <p style={{ color: "#b0b0b0", fontSize: "0.9rem", marginTop: "1rem" }}>
            This will notify everyone that the auction will start in the specified time.
          </p>
        </div>

        {/* Auction Controls */}
        <div className="admin-section">
          <h3>Auction Controls</h3>
          <div className="control-buttons">
            <button
              onClick={startAuction}
              className="btn-success"
              disabled={gameState.auctionStarted && !gameState.auctionEnded}
            >
              Start Auction Now
            </button>
            <button
              onClick={startTimer}
              className="btn-success"
              disabled={gameState.timerActive || !gameState.auctionActive || gameState.auctionEnded}
            >
              Start Timer
            </button>
            <button
              onClick={gameState.timerPaused ? resumeTimer : pauseTimer}
              className="btn-warning"
              disabled={!gameState.timerActive || gameState.auctionEnded}
            >
              {gameState.timerPaused ? "Resume Timer" : "Pause Timer"}
            </button>
            <button
              onClick={stopTimer}
              className="btn-warning"
              disabled={!gameState.timerActive || gameState.auctionEnded}
            >
              Stop Timer
            </button>
            <button
              onClick={nextPlayer}
              className="btn-primary"
              disabled={gameState.auctionEnded || !gameState.auctionActive}
            >
              Next Player (Manual)
            </button>
            <button
              onClick={endAuction}
              className="btn-danger"
              disabled={gameState.auctionEnded || !gameState.auctionActive}
            >
              Force End Auction
            </button>
            <button onClick={restartAuction} className="btn-danger" style={{ gridColumn: "span 2" }}>
              🔄 Restart Auction
            </button>
          </div>
        </div>

        {/* Current Status */}
        <div className="admin-section">
          <h3>Current Status</h3>
          <div className="status-display">
            {gameState.preAuctionActive ? (
              <>
                <h4>⏰ Pre-Auction Timer Active</h4>
                <p>Time remaining: {formatTime(gameState.preAuctionTimer)}</p>
                <p>Players ready: {gameState.players.length}</p>
              </>
            ) : gameState.auctionEnded ? (
              <>
                <h4>🏁 Auction Completed</h4>
                <p>Captain 1 Team: {gameState.captain1Team.length} players</p>
                <p>Captain 2 Team: {gameState.captain2Team.length} players</p>
                <p>Total Rounds: {gameState.auctionRound}</p>
                <p style={{ color: "#4ecdc4", fontSize: "0.9rem" }}>✅ All players have been sold</p>
              </>
            ) : gameState.auctionActive && gameState.players.length > 0 ? (
              <>
                <h4>🎯 Current Player: {gameState.players[gameState.currentPlayerIndex]?.name || "None"}</h4>
                <p>
                  Round {gameState.auctionRound} - Player {gameState.currentPlayerIndex + 1} of{" "}
                  {gameState.players.length}
                </p>
                <p>Base Price: ₹{gameState.players[gameState.currentPlayerIndex]?.basePrice?.toLocaleString()}</p>
                <p>Current Bid: ₹{gameState.currentBid.toLocaleString()}</p>
                <p>
                  Highest Bidder:{" "}
                  {gameState.highestBidder
                    ? gameState.highestBidder === "captain1"
                      ? "Captain 1 ⚡"
                      : "Captain 2 🔥"
                    : "None"}
                </p>
                <p>
                  Timer: {gameState.timeRemaining}s
                  {gameState.timerActive
                    ? gameState.timerPaused
                      ? " (⏸️ Paused)"
                      : " (▶️ Running - Auto-advance at 0)"
                    : " (⏹️ Stopped)"}
                </p>
                <p>
                  Captain 1 Balance: ₹{gameState.captain1Balance.toLocaleString()} ({gameState.captain1Team.length}{" "}
                  players)
                </p>
                <p>
                  Captain 2 Balance: ₹{gameState.captain2Balance.toLocaleString()} ({gameState.captain2Team.length}{" "}
                  players)
                </p>
                {Math.abs(gameState.captain1Team.length - gameState.captain2Team.length) > 1 && (
                  <p style={{ color: "#f39c12", fontWeight: "bold" }}>
                    ⚖️ Team Balance:{" "}
                    {gameState.captain1Team.length > gameState.captain2Team.length ? "Captain 1" : "Captain 2"} cannot
                    bid (too many players)
                  </p>
                )}
              </>
            ) : gameState.auctionStarted ? (
              <p>🎪 Auction started - Ready for bidding!</p>
            ) : (
              <p>⏳ No auction active - Add players and start auction</p>
            )}
          </div>
        </div>
      </div>

      {/* Current Player Display */}
      {gameState.auctionActive && gameState.players.length > 0 && !gameState.auctionEnded && (
        <div className="current-player-section fade-in">
          <h3>🎯 Current Player on Auction {gameState.auctionRound > 1 && `(Round ${gameState.auctionRound})`}</h3>
          <div className="player-card-admin current-player-card">
            <div className="player-image">🏏</div>
            <div className="player-name">{gameState.players[gameState.currentPlayerIndex]?.name}</div>
            <div className="player-role">{gameState.players[gameState.currentPlayerIndex]?.role}</div>
            <div className="player-base-price">
              Base Price: ₹{gameState.players[gameState.currentPlayerIndex]?.basePrice?.toLocaleString()}
            </div>
            <div
              style={{
                marginTop: "1rem",
                padding: "0.5rem",
                background: "rgba(0, 245, 255, 0.2)",
                borderRadius: "8px",
                border: "2px solid #00f5ff",
              }}
            >
              <strong style={{ color: "#00f5ff" }}>LIVE AUCTION</strong>
              {gameState.auctionRound > 1 && (
                <div style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>Re-auction Round {gameState.auctionRound}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
