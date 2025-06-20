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
      auctionRound: 1,
      lastUpdate: Date.now(),
    }

    this.timerInterval = null
    this.preAuctionInterval = null
    this.cleanupTimeout = null
    this.broadcastCallback = null
    GameStateManager.instance = this
  }

  setBroadcastCallback(callback) {
    this.broadcastCallback = callback
  }

  broadcast() {
    if (this.broadcastCallback) {
      this.broadcastCallback()
    }
  }

  getState() {
    return { ...this.gameState }
  }

  updateState(newState) {
    this.gameState = { ...this.gameState, ...newState, lastUpdate: Date.now() }
    this.broadcast()
    return this.gameState
  }

  addPlayer(playerData) {
    const newPlayer = {
      id: Date.now(),
      name: playerData.name,
      role: playerData.role,
      basePrice: playerData.basePrice || 50000,
    }
    this.gameState.players.push(newPlayer)
    this.gameState.lastUpdate = Date.now()
    this.broadcast()
    return this.gameState
  }

  removePlayer(playerId) {
    this.gameState.players = this.gameState.players.filter((player) => player.id !== playerId)

    if (this.gameState.currentPlayerIndex >= this.gameState.players.length) {
      this.gameState.currentPlayerIndex = Math.max(0, this.gameState.players.length - 1)
    }

    this.gameState.lastUpdate = Date.now()
    this.broadcast()
    return this.gameState
  }

  setBalances(balances) {
    this.gameState.captain1Balance = balances.captain1
    this.gameState.captain2Balance = balances.captain2
    this.gameState.lastUpdate = Date.now()
    this.broadcast()
    return this.gameState
  }

  startPreAuctionTimer(seconds) {
    if (this.gameState.players.length === 0) {
      return { success: false, message: "No players added" }
    }

    this.clearAllTimers()

    this.gameState.preAuctionActive = true
    this.gameState.preAuctionTimer = seconds
    this.gameState.auctionStarted = false
    this.gameState.auctionActive = false
    this.gameState.auctionEnded = false
    this.gameState.lastUpdate = Date.now()
    this.broadcast()

    this.preAuctionInterval = setInterval(() => {
      this.gameState.preAuctionTimer--
      this.gameState.lastUpdate = Date.now()
      this.broadcast()

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
    this.gameState.auctionRound = 1

    const currentPlayer = this.gameState.players[0]
    this.gameState.currentBid = currentPlayer ? currentPlayer.basePrice : 0

    this.gameState.highestBidder = null
    this.gameState.timeRemaining = 60
    this.gameState.timerActive = false
    this.gameState.timerPaused = false
    this.gameState.lastUpdate = Date.now()

    if (this.cleanupTimeout) {
      clearTimeout(this.cleanupTimeout)
      this.cleanupTimeout = null
    }

    this.broadcast()
    return { success: true, gameState: this.gameState }
  }

  startTimer() {
    if (!this.gameState.auctionActive || this.gameState.players.length === 0) {
      return this.gameState
    }

    this.gameState.timerActive = true
    this.gameState.timerPaused = false
    this.gameState.lastUpdate = Date.now()
    this.broadcast()

    if (this.timerInterval) clearInterval(this.timerInterval)
    this.timerInterval = setInterval(() => {
      if (!this.gameState.timerPaused) {
        this.gameState.timeRemaining--
        this.gameState.lastUpdate = Date.now()
        this.broadcast()

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
    this.broadcast()
    return this.gameState
  }

  resumeTimer() {
    this.gameState.timerPaused = false
    this.gameState.lastUpdate = Date.now()
    this.broadcast()
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
    this.broadcast()
    return this.gameState
  }

  handleTimerEnd() {
    clearInterval(this.timerInterval)
    this.timerInterval = null
    this.gameState.timerActive = false
    this.gameState.timerPaused = false

    const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex]

    if (this.gameState.highestBidder && this.gameState.currentBid > 0) {
      currentPlayer.soldTo = this.gameState.highestBidder
      currentPlayer.soldPrice = this.gameState.currentBid

      if (this.gameState.highestBidder === "captain1") {
        this.gameState.captain1Team.push(currentPlayer)
        this.gameState.captain1Balance -= this.gameState.currentBid
      } else {
        this.gameState.captain2Team.push(currentPlayer)
        this.gameState.captain2Balance -= this.gameState.currentBid
      }
    } else {
      currentPlayer.soldTo = "unsold"
      currentPlayer.soldPrice = 0
    }

    this.advanceToNextPlayer()
  }

  placeBid(amount, captain) {
    const captainBalance = captain === "captain1" ? this.gameState.captain1Balance : this.gameState.captain2Balance
    const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex]
    const minimumBid = Math.max(this.gameState.currentBid + 1, currentPlayer?.basePrice || 0)

    if (amount >= minimumBid && amount <= captainBalance && this.gameState.timerActive && !this.gameState.timerPaused) {
      this.gameState.currentBid = amount
      this.gameState.highestBidder = captain
      this.gameState.lastUpdate = Date.now()
      this.broadcast()
      return { success: true, gameState: this.gameState }
    }

    return { success: false, gameState: this.gameState }
  }

  advanceToNextPlayer() {
    this.gameState.currentPlayerIndex++
    this.gameState.highestBidder = null
    this.gameState.timerActive = false
    this.gameState.timerPaused = false
    this.gameState.timeRemaining = 60

    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }

    if (this.gameState.currentPlayerIndex >= this.gameState.players.length) {
      this.handleRoundEnd()
    } else {
      const nextPlayer = this.gameState.players[this.gameState.currentPlayerIndex]
      this.gameState.currentBid = nextPlayer.basePrice
    }

    this.gameState.lastUpdate = Date.now()
    this.broadcast()
  }

  handleRoundEnd() {
    const unsoldPlayers = this.gameState.players.filter((player) => player.soldTo === "unsold")

    if (unsoldPlayers.length > 0) {
      this.gameState.auctionRound++

      unsoldPlayers.forEach((player) => {
        delete player.soldTo
        delete player.soldPrice
      })

      this.gameState.players = this.gameState.players.filter((player) => !player.soldTo || player.soldTo === "unsold")

      this.gameState.currentPlayerIndex = 0
      if (this.gameState.players.length > 0) {
        const firstPlayer = this.gameState.players[0]
        this.gameState.currentBid = firstPlayer.basePrice
        delete firstPlayer.soldTo
        delete firstPlayer.soldPrice
      }

      this.gameState.lastUpdate = Date.now()
      this.broadcast()
    } else {
      this.endAuction()
    }
  }

  nextPlayer() {
    const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex]

    if (this.gameState.highestBidder && this.gameState.currentBid > 0) {
      currentPlayer.soldTo = this.gameState.highestBidder
      currentPlayer.soldPrice = this.gameState.currentBid

      if (this.gameState.highestBidder === "captain1") {
        this.gameState.captain1Team.push(currentPlayer)
        this.gameState.captain1Balance -= this.gameState.currentBid
      } else {
        this.gameState.captain2Team.push(currentPlayer)
        this.gameState.captain2Balance -= this.gameState.currentBid
      }
    } else {
      currentPlayer.soldTo = "unsold"
      currentPlayer.soldPrice = 0
    }

    this.advanceToNextPlayer()
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

    this.gameState.lastUpdate = Date.now()
    this.broadcast()
    return this.gameState
  }

  clearData() {
    console.log("Manually clearing auction data...")
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
    this.gameState.auctionRound = 1
    this.gameState.captain1Balance = 1000000
    this.gameState.captain2Balance = 1000000
    this.gameState.lastUpdate = Date.now()

    if (this.cleanupTimeout) {
      clearTimeout(this.cleanupTimeout)
      this.cleanupTimeout = null
    }

    this.broadcast()
    return this.gameState
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
    this.clearAllTimers()

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
      auctionRound: 1,
      lastUpdate: Date.now(),
    }

    this.broadcast()
    return this.gameState
  }
}

// Authentication
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

// Set up WebSocket broadcasting
if (typeof window === "undefined") {
  // Only on server side
  import("./websocket-server.js")
    .then(({ broadcastGameState }) => {
      gameStateManager.setBroadcastCallback(broadcastGameState)
    })
    .catch(() => {
      // Fallback if WebSocket is not available
      console.log("WebSocket not available, using polling fallback")
    })
}

export default gameStateManager
