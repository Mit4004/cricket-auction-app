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
      timerPaused: false,
      timeRemaining: 60,
      auctionActive: false,
      auctionEnded: false,
      auctionStarted: false,
      preAuctionTimer: 0,
      preAuctionActive: false,
      lastUpdate: Date.now(),
    }

    this.timerInterval = null
    this.preAuctionInterval = null
    this.cleanupTimeout = null
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

  removePlayer(playerId) {
    this.gameState.players = this.gameState.players.filter((player) => player.id !== playerId)

    // Adjust current player index if necessary
    if (this.gameState.currentPlayerIndex >= this.gameState.players.length) {
      this.gameState.currentPlayerIndex = Math.max(0, this.gameState.players.length - 1)
    }

    this.gameState.lastUpdate = Date.now()
    return this.gameState
  }

  setBalances(balances) {
    this.gameState.captain1Balance = balances.captain1
    this.gameState.captain2Balance = balances.captain2
    this.gameState.lastUpdate = Date.now()
    return this.gameState
  }

  startPreAuctionTimer(seconds) {
    if (this.gameState.players.length === 0) {
      return { success: false, message: "No players added" }
    }

    // Clear any existing timers
    this.clearAllTimers()

    this.gameState.preAuctionActive = true
    this.gameState.preAuctionTimer = seconds
    this.gameState.auctionStarted = false
    this.gameState.auctionActive = false
    this.gameState.auctionEnded = false
    this.gameState.lastUpdate = Date.now()

    this.preAuctionInterval = setInterval(() => {
      this.gameState.preAuctionTimer--
      this.gameState.lastUpdate = Date.now()

      if (this.gameState.preAuctionTimer <= 0) {
        clearInterval(this.preAuctionInterval)
        this.preAuctionInterval = null
        this.gameState.preAuctionActive = false
        this.startAuction()
      }
    }, 1000)

    return { success: true, gameState: this.gameState }
  }

  startAuction() {
    if (this.gameState.players.length === 0) {
      return { success: false, message: "No players added" }
    }

    // Clear pre-auction timer if running
    if (this.preAuctionInterval) {
      clearInterval(this.preAuctionInterval)
      this.preAuctionInterval = null
    }

    this.gameState.preAuctionActive = false
    this.gameState.preAuctionTimer = 0
    this.gameState.auctionStarted = true
    this.gameState.auctionActive = true
    this.gameState.auctionEnded = false
    this.gameState.currentPlayerIndex = 0
    this.gameState.currentBid = 0
    this.gameState.highestBidder = null
    this.gameState.timeRemaining = 60
    this.gameState.timerActive = false
    this.gameState.timerPaused = false
    this.gameState.lastUpdate = Date.now()

    // Clear any existing cleanup timeout
    if (this.cleanupTimeout) {
      clearTimeout(this.cleanupTimeout)
      this.cleanupTimeout = null
    }

    return { success: true, gameState: this.gameState }
  }

  startTimer() {
    if (!this.gameState.auctionActive || this.gameState.players.length === 0) {
      return this.gameState
    }

    this.gameState.timerActive = true
    this.gameState.timerPaused = false
    this.gameState.lastUpdate = Date.now()

    // Start countdown
    if (this.timerInterval) clearInterval(this.timerInterval)
    this.timerInterval = setInterval(() => {
      if (!this.gameState.timerPaused) {
        this.gameState.timeRemaining--
        this.gameState.lastUpdate = Date.now()

        if (this.gameState.timeRemaining <= 0) {
          this.handleTimerEnd()
        }
      }
    }, 1000)

    return this.gameState
  }

  pauseTimer() {
    this.gameState.timerPaused = true
    this.gameState.lastUpdate = Date.now()
    return this.gameState
  }

  resumeTimer() {
    this.gameState.timerPaused = false
    this.gameState.lastUpdate = Date.now()
    return this.gameState
  }

  stopTimer() {
    this.gameState.timerActive = false
    this.gameState.timerPaused = false
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
    this.gameState.lastUpdate = Date.now()
    return this.gameState
  }

  handleTimerEnd() {
    clearInterval(this.timerInterval)
    this.timerInterval = null
    this.gameState.timerActive = false
    this.gameState.timerPaused = false

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

  placeBid(amount, captain) {
    const captainBalance = captain === "captain1" ? this.gameState.captain1Balance : this.gameState.captain2Balance

    if (
      amount > this.gameState.currentBid &&
      amount <= captainBalance &&
      this.gameState.timerActive &&
      !this.gameState.timerPaused
    ) {
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
    this.gameState.timerPaused = false
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
    this.gameState.timerPaused = false

    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }

    // Set cleanup timeout for 25 seconds - ONLY after auction actually ends
    this.cleanupTimeout = setTimeout(() => {
      this.cleanupAuctionData()
    }, 25000)

    this.gameState.lastUpdate = Date.now()
    return this.gameState
  }

  cleanupAuctionData() {
    console.log("Cleaning up auction data after 25 seconds...")
    this.gameState.players = []
    this.gameState.captain1Team = []
    this.gameState.captain2Team = []
    this.gameState.currentPlayerIndex = 0
    this.gameState.currentBid = 0
    this.gameState.highestBidder = null
    this.gameState.auctionEnded = false
    this.gameState.auctionActive = false
    this.gameState.auctionStarted = false
    this.gameState.preAuctionActive = false
    this.gameState.preAuctionTimer = 0
    this.gameState.captain1Balance = 1000000
    this.gameState.captain2Balance = 1000000
    this.gameState.lastUpdate = Date.now()

    if (this.cleanupTimeout) {
      clearTimeout(this.cleanupTimeout)
      this.cleanupTimeout = null
    }
  }

  clearAllTimers() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
    if (this.preAuctionInterval) {
      clearInterval(this.preAuctionInterval)
      this.preAuctionInterval = null
    }
    if (this.cleanupTimeout) {
      clearTimeout(this.cleanupTimeout)
      this.cleanupTimeout = null
    }
  }

  restartAuction() {
    // Clear all timers and timeouts
    this.clearAllTimers()

    // Reset all state
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
      timerPaused: false,
      timeRemaining: 60,
      auctionActive: false,
      auctionEnded: false,
      auctionStarted: false,
      preAuctionTimer: 0,
      preAuctionActive: false,
      lastUpdate: Date.now(),
    }

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
