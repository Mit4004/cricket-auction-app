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

export default function AdminPage() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [playerName, setPlayerName] = useState("")
  const [playerRole, setPlayerRole] = useState("Batsman")
  const [captain1Balance, setCaptain1Balance] = useState(1000000)
  const [captain2Balance, setCaptain2Balance] = useState(1000000)
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

    // Poll for updates every 2 seconds
    const interval = setInterval(fetchGameState, 2000)
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

    try {
      const response = await fetch("/api/admin/add-player", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: playerName, role: playerRole, adminPin }),
      })

      if (response.ok) {
        setPlayerName("")
        fetchGameState()
      } else {
        alert("Error adding player")
      }
    } catch (error) {
      console.error("Error adding player:", error)
      alert("Error adding player")
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
      } else {
        alert("Error setting balances")
      }
    } catch (error) {
      console.error("Error setting balances:", error)
      alert("Error setting balances")
    }
  }

  const startTimer = async () => {
    if (!gameState || gameState.players.length === 0) {
      alert("Please add players first")
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
      } else {
        alert("Error starting timer")
      }
    } catch (error) {
      console.error("Error starting timer:", error)
      alert("Error starting timer")
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
        } else {
          alert("Error ending auction")
        }
      } catch (error) {
        console.error("Error ending auction:", error)
        alert("Error ending auction")
      }
    }
  }

  const logout = () => {
    sessionStorage.removeItem("userRole")
    sessionStorage.removeItem("userPin")
    window.location.href = "/"
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
        <h1>🏏 Admin Control Panel</h1>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <span style={{ color: "#4ecdc4" }}>🟢 Connected</span>
          <button onClick={logout} className="btn-secondary">
            Logout
          </button>
        </div>
      </div>

      <div className="admin-grid">
        {/* Player Management */}
        <div className="admin-section">
          <h3>Add Players</h3>
          <div className="form-group">
            <input
              type="text"
              placeholder="Player Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <select value={playerRole} onChange={(e) => setPlayerRole(e.target.value)}>
              <option value="Batsman">Batsman</option>
              <option value="Bowler">Bowler</option>
              <option value="All-Rounder">All-Rounder</option>
              <option value="Wicket-Keeper">Wicket-Keeper</option>
            </select>
            <button onClick={addPlayer} className="btn-primary">
              Add Player
            </button>
          </div>
          <div className="players-list">
            {gameState.players.map((player, index) => (
              <div key={player.id} className="player-item">
                <div>
                  <strong>{player.name}</strong> - {player.role}
                  <br />
                  <small>
                    {player.soldTo
                      ? `Sold to ${player.soldTo === "captain1" ? "Captain 1" : "Captain 2"} for ₹${player.soldPrice?.toLocaleString()}`
                      : index === gameState.currentPlayerIndex
                        ? "Current Player"
                        : "Available"}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Balance Management */}
        <div className="admin-section">
          <h3>Set Captain Balances</h3>
          <div className="form-group">
            <label>Captain 1 Balance:</label>
            <input type="number" value={captain1Balance} onChange={(e) => setCaptain1Balance(Number(e.target.value))} />
            <label>Captain 2 Balance:</label>
            <input type="number" value={captain2Balance} onChange={(e) => setCaptain2Balance(Number(e.target.value))} />
            <button onClick={setBalances} className="btn-primary">
              Update Balances
            </button>
          </div>
        </div>

        {/* Auction Controls */}
        <div className="admin-section">
          <h3>Auction Controls</h3>
          <div className="control-buttons">
            <button
              onClick={startTimer}
              className="btn-success"
              disabled={gameState.timerActive || gameState.auctionEnded}
            >
              Start Timer
            </button>
            <button
              onClick={stopTimer}
              className="btn-warning"
              disabled={!gameState.timerActive || gameState.auctionEnded}
            >
              Stop Timer
            </button>
            <button onClick={nextPlayer} className="btn-primary" disabled={gameState.auctionEnded}>
              Next Player
            </button>
            <button onClick={endAuction} className="btn-danger" disabled={gameState.auctionEnded}>
              End Auction
            </button>
          </div>
        </div>

        {/* Current Status */}
        <div className="admin-section">
          <h3>Current Status</h3>
          <div className="status-display">
            {gameState.auctionEnded ? (
              <>
                <h4>Auction Ended</h4>
                <p>Captain 1 Team: {gameState.captain1Team.length} players</p>
                <p>Captain 2 Team: {gameState.captain2Team.length} players</p>
              </>
            ) : gameState.auctionActive && gameState.players.length > 0 ? (
              <>
                <h4>Current Player: {gameState.players[gameState.currentPlayerIndex]?.name || "None"}</h4>
                <p>Current Bid: ₹{gameState.currentBid.toLocaleString()}</p>
                <p>
                  Highest Bidder:{" "}
                  {gameState.highestBidder
                    ? gameState.highestBidder === "captain1"
                      ? "Captain 1"
                      : "Captain 2"
                    : "None"}
                </p>
                <p>
                  Timer: {gameState.timeRemaining}s {gameState.timerActive ? "(Running)" : "(Stopped)"}
                </p>
                <p>Captain 1 Balance: ₹{gameState.captain1Balance.toLocaleString()}</p>
                <p>Captain 2 Balance: ₹{gameState.captain2Balance.toLocaleString()}</p>
              </>
            ) : (
              <p>No auction active</p>
            )}
          </div>
        </div>
      </div>

      {/* Current Player Display */}
      {gameState.auctionActive && gameState.players.length > 0 && !gameState.auctionEnded && (
        <div className="current-player-section">
          <h3>Current Player</h3>
          <div className="player-card-admin">
            <div className="player-image">🏏</div>
            <div className="player-name">{gameState.players[gameState.currentPlayerIndex]?.name}</div>
            <div className="player-role">{gameState.players[gameState.currentPlayerIndex]?.role}</div>
          </div>
        </div>
      )}
    </div>
  )
}
