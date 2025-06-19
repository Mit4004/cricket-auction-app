// Singleton game state that will be shared across all API routes
class GameStateManager {
  constructor() {
    if (GameStateManager.instance) {
      return GameStateManager.instance
    }

    this.gameState = {
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
      lastUpdate: Date.now(),
    }

    this.timerInterval = null
    GameStateManager.instance = this
  }

  getState() {
    return { ...this.gameState }
  }

  updateState(newState) {
    this.gameState = { ...this.gameState, ...newState, lastUpdate: Date.now() }
    return this.gameState
  }

  addPlayer(playerData) {
    const newPlayer = {
      id: Date.now(),
      name: playerData.name,
      role: playerData.role,
    }
    this.gameState.players.push(newPlayer)
    this.gameState.lastUpdate = Date.now()
    return this.gameState
  }

  setBalances(balances) {
    this.gameState.captain1Balance = balances.captain1
    this.gameState.captain2Balance = balances.captain2
    this.gameState.lastUpdate = Date.now()
    return this.gameState
  }

  startTimer() {
    if (this.gameState.timerActive || this.gameState.players.length === 0) {
      return this.gameState
    }

    this.gameState.timerActive = true
    this.gameState.auctionActive = true
    this.gameState.timeRemaining = 60
    this.gameState.lastUpdate = Date.now()

    // Start countdown
    if (this.timerInterval) clearInterval(this.timerInterval)
    this.timerInterval = setInterval(() => {
      this.gameState.timeRemaining--
      this.gameState.lastUpdate = Date.now()

      if (this.gameState.timeRemaining <= 0) {
        clearInterval(this.timerInterval)
        this.timerInterval = null
        this.gameState.timerActive = false

        // Auto-assign player to highest bidder
        if (this.gameState.highestBidder && this.gameState.currentBid > 0) {
          const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex]
          currentPlayer.soldTo = this.gameState.highestBidder
          currentPlayer.soldPrice = this.gameState.currentBid

          if (this.gameState.highestBidder === "captain1") {
            this.gameState.captain1Team.push(currentPlayer)
            this.gameState.captain1Balance -= this.gameState.currentBid
          } else {
            this.gameState.captain2Team.push(currentPlayer)
            this.gameState.captain2Balance -= this.gameState.currentBid
          }
        }
        this.gameState.lastUpdate = Date.now()
      }
    }, 1000)

    return this.gameState
  }

  stopTimer() {
    this.gameState.timerActive = false
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
    this.gameState.lastUpdate = Date.now()
    return this.gameState
  }

  placeBid(amount, captain) {
    const captainBalance = captain === "captain1" ? this.gameState.captain1Balance : this.gameState.captain2Balance

    if (amount > this.gameState.currentBid && amount <= captainBalance && this.gameState.timerActive) {
      this.gameState.currentBid = amount
      this.gameState.highestBidder = captain
      this.gameState.lastUpdate = Date.now()
      return { success: true, gameState: this.gameState }
    }

    return { success: false, gameState: this.gameState }
  }

  nextPlayer() {
    // Assign current player if there's a bid
    if (this.gameState.highestBidder && this.gameState.currentBid > 0) {
      const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex]
      currentPlayer.soldTo = this.gameState.highestBidder
      currentPlayer.soldPrice = this.gameState.currentBid

      if (this.gameState.highestBidder === "captain1") {
        this.gameState.captain1Team.push(currentPlayer)
        this.gameState.captain1Balance -= this.gameState.currentBid
      } else {
        this.gameState.captain2Team.push(currentPlayer)
        this.gameState.captain2Balance -= this.gameState.currentBid
      }
    }

    // Move to next player
    this.gameState.currentPlayerIndex++
    this.gameState.currentBid = 0
    this.gameState.highestBidder = null
    this.gameState.timerActive = false
    this.gameState.timeRemaining = 60

    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }

    if (this.gameState.currentPlayerIndex >= this.gameState.players.length) {
      this.endAuction()
    }

    this.gameState.lastUpdate = Date.now()
    return this.gameState
  }

  endAuction() {
    this.gameState.auctionEnded = true
    this.gameState.auctionActive = false
    this.gameState.timerActive = false

    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }

    this.gameState.lastUpdate = Date.now()
    return this.gameState
  }
}

// Authentication - Updated with better fallbacks
const PINS = {
  admin: process.env.ADMIN_PIN || process.env.NEXT_PUBLIC_ADMIN_PIN || "admin123",
  captain1: process.env.CAPTAIN1_PIN || process.env.NEXT_PUBLIC_CAPTAIN1_PIN || "team1",
  captain2: process.env.CAPTAIN2_PIN || process.env.NEXT_PUBLIC_CAPTAIN2_PIN || "team2",
}

export function authenticateUser(role, pin) {
  console.log("Authenticating:", { role, pin, expectedPin: PINS[role] })
  if (role === "spectator") return true
  const isValid = PINS[role] && PINS[role] === pin
  console.log("Authentication result:", isValid)
  return isValid
}

// Export singleton instance
const gameStateManager = new GameStateManager()
export default gameStateManager
