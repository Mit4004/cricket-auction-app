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

export default function CaptainPage() {
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

  const [bidAmount, setBidAmount] = useState("")
  const [userRole, setUserRole] = useState<string>("")

  useEffect(() => {
    const role = sessionStorage.getItem("userRole")
    if (!role || (role !== "captain1" && role !== "captain2")) {
      window.location.href = "/"
      return
    }

    setUserRole(role)
    socketInitializer(role)
    return () => {
      if (socket) socket.disconnect()
    }
  }, [])

  const socketInitializer = async (role: string) => {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "", {
      path: "/api/socket",
      addTrailingSlash: false,
    })

    const pins = { captain1: "11111", captain2: "22222" }
    socket.emit("authenticate", { role, pin: pins[role as keyof typeof pins] })

    socket.on("gameState", (state: GameState) => {
      setGameState(state)
    })

    socket.on("timerUpdate", (timeRemaining: number) => {
      setGameState((prev) => ({ ...prev, timeRemaining }))
    })

    socket.on("newBid", (bidData: { amount: number; captain: string }) => {
      const bidderName = bidData.captain === "captain1" ? "Captain 1 ⚡" : "Captain 2 🔥"
      showNotification(`New bid: ₹${bidData.amount.toLocaleString()} by ${bidderName}`)

      if (bidData.captain === userRole) {
        showSuccessMessage("Bid placed successfully!")
      }
    })

    socket.on("playerSold", (data: { player: Player; soldTo: string; price: number }) => {
      const captainName = data.soldTo === "captain1" ? "Captain 1 ⚡" : "Captain 2 🔥"
      showNotification(`${data.player.name} sold to ${captainName} for ₹${data.price.toLocaleString()}`)
    })

    socket.on("nextPlayer", (player: Player) => {
      showNotification(`Next player: ${player.name} (${player.role})`)
    })

    socket.on("auctionEnded", () => {
      showNotification("Auction has ended!")
    })
  }

  const placeBid = () => {
    const amount = Number.parseInt(bidAmount)

    if (!amount || amount <= 0) {
      alert("Please enter a valid bid amount")
      return
    }

    const currentBalance = userRole === "captain1" ? gameState.captain1Balance : gameState.captain2Balance

    if (amount > currentBalance) {
      alert("Insufficient balance!")
      return
    }

    if (amount <= gameState.currentBid) {
      alert("Bid must be higher than current bid")
      return
    }

    if (!gameState.timerActive) {
      alert("Bidding is not active")
      return
    }

    socket.emit("placeBid", { amount, captain: userRole })
    setBidAmount("")
  }

  const quickBid = (amount: number) => {
    const newBid = gameState.currentBid + amount
    setBidAmount(newBid.toString())
  }

  const logout = () => {
    sessionStorage.removeItem("userRole")
    window.location.href = "/"
  }

  const showNotification = (message: string) => {
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
    `
    notification.textContent = message
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 3000)
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
        <button onClick={logout} className="btn-secondary">
          Logout
        </button>
      </div>

      {!gameState.auctionActive || gameState.players.length === 0 ? (
        <div className="auction-status">
          <p>Waiting for auction to start...</p>
        </div>
      ) : gameState.auctionEnded ? (
        <div className="team-display">
          <h3>Your Team</h3>
          <div className="team-list">
            {myTeam.map((player) => (
              <div key={player.id} className="team-player">
                <div className="team-player-name">{player.name}</div>
                <div className="team-player-role">{player.role}</div>
                <div className="team-player-price">₹{player.soldPrice?.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="player-display">
          <div className="player-card">
            <div className="player-image">🏏</div>
            <div className="player-name">{currentPlayer?.name}</div>
            <div className="player-role">{currentPlayer?.role}</div>
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
                  : "No bids yet"}
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
              <p>seconds remaining</p>
            </div>

            <div className="bid-controls">
              <input
                type="number"
                className="bid-amount-input"
                placeholder="Enter bid amount"
                min="0"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && placeBid()}
              />
              <button onClick={placeBid} className="btn-bid">
                Place Bid
              </button>
            </div>

            <div className="quick-bids">
              <button onClick={() => quickBid(50000)} className="btn-quick">
                +50K
              </button>
              <button onClick={() => quickBid(100000)} className="btn-quick">
                +100K
              </button>
              <button onClick={() => quickBid(200000)} className="btn-quick">
                +200K
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
