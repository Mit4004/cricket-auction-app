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

export default function AdminPage() {
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

  const [playerName, setPlayerName] = useState("")
  const [playerRole, setPlayerRole] = useState("Batsman")
  const [captain1Balance, setCaptain1Balance] = useState(1000000)
  const [captain2Balance, setCaptain2Balance] = useState(1000000)

  useEffect(() => {
    const userRole = sessionStorage.getItem("userRole")
    if (userRole !== "admin") {
      window.location.href = "/"
      return
    }

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

    socket.emit("authenticate", { role: "admin", pin: "12345" })

    socket.on("gameState", (state: GameState) => {
      setGameState(state)
      setCaptain1Balance(state.captain1Balance)
      setCaptain2Balance(state.captain2Balance)
    })

    socket.on("timerUpdate", (timeRemaining: number) => {
      setGameState((prev) => ({ ...prev, timeRemaining }))
    })

    socket.on("newBid", (bidData: { amount: number; captain: string }) => {
      showNotification(
        `New bid: ₹${bidData.amount.toLocaleString()} by ${bidData.captain === "captain1" ? "Captain 1" : "Captain 2"}`,
      )
    })

    socket.on("playerSold", (data: { player: Player; soldTo: string; price: number }) => {
      const captainName = data.soldTo === "captain1" ? "Captain 1" : "Captain 2"
      showNotification(`${data.player.name} sold to ${captainName} for ₹${data.price.toLocaleString()}`)
    })

    socket.on("auctionEnded", () => {
      showNotification("Auction has ended!")
    })
  }

  const addPlayer = () => {
    if (!playerName.trim()) {
      alert("Please enter player name")
      return
    }

    socket.emit("addPlayer", { name: playerName, role: playerRole })
    setPlayerName("")
  }

  const setBalances = () => {
    if (captain1Balance < 0 || captain2Balance < 0) {
      alert("Balances must be positive")
      return
    }

    socket.emit("setBalances", { captain1: captain1Balance, captain2: captain2Balance })
  }

  const startTimer = () => {
    if (gameState.players.length === 0) {
      alert("Please add players first")
      return
    }
    socket.emit("startTimer")
  }

  const stopTimer = () => {
    socket.emit("stopTimer")
  }

  const nextPlayer = () => {
    socket.emit("nextPlayer")
  }

  const endAuction = () => {
    if (confirm("Are you sure you want to end the auction?")) {
      socket.emit("endAuction")
    }
  }

  const logout = () => {
    sessionStorage.removeItem("userRole")
    window.location.href = "/"
  }

  const showNotification = (message: string) => {
    // Simple notification implementation
    const notification = document.createElement("div")
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(45deg, #00f5ff, #0099cc);
      color: white;
      padding: 1rem 2rem;
      border-radius: 8px;
      box-shadow: 0 0 20px rgba(0, 245, 255, 0.5);
      z-index: 1000;
    `
    notification.textContent = message
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 3000)
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>🏏 Admin Control Panel</h1>
        <button onClick={logout} className="btn-secondary">
          Logout
        </button>
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
