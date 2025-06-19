// In-memory game state (in production, you'd use a database)
let gameState = {
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

let timerInterval = null

// Authentication - Updated with better fallbacks
const PINS = {
  admin: process.env.ADMIN_PIN || process.env.NEXT_PUBLIC_ADMIN_PIN || "admin123",
  captain1: process.env.CAPTAIN1_PIN || process.env.NEXT_PUBLIC_CAPTAIN1_PIN || "team1",
  captain2: process.env.CAPTAIN2_PIN || process.env.NEXT_PUBLIC_CAPTAIN2_PIN || "team2",
}

export function getGameState() {
  return { ...gameState }
}

export function updateGameState(newState) {
  gameState = { ...gameState, ...newState, lastUpdate: Date.now() }
  return gameState
}

export function authenticateUser(role, pin) {
  console.log("Authenticating:", { role, pin, expectedPin: PINS[role] })
  if (role === "spectator") return true
  const isValid = PINS[role] && PINS[role] === pin
  console.log("Authentication result:", isValid)
  return isValid
}

export function addPlayer(playerData) {
  const newPlayer = {
    id: Date.now(),
    name: playerData.name,
    role: playerData.role,
  }
  gameState.players.push(newPlayer)
  gameState.lastUpdate = Date.now()
  return gameState
}

export function setBalances(balances) {
  gameState.captain1Balance = balances.captain1
  gameState.captain2Balance = balances.captain2
  gameState.lastUpdate = Date.now()
  return gameState
}

export function startTimer() {
  if (gameState.timerActive || gameState.players.length === 0) return gameState

  gameState.timerActive = true
  gameState.auctionActive = true
  gameState.timeRemaining = 60
  gameState.lastUpdate = Date.now()

  // Start countdown
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    gameState.timeRemaining--
    gameState.lastUpdate = Date.now()

    if (gameState.timeRemaining <= 0) {
      clearInterval(timerInterval)
      timerInterval = null
      gameState.timerActive = false

      // Auto-assign player to highest bidder
      if (gameState.highestBidder && gameState.currentBid > 0) {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex]
        currentPlayer.soldTo = gameState.highestBidder
        currentPlayer.soldPrice = gameState.currentBid

        if (gameState.highestBidder === "captain1") {
          gameState.captain1Team.push(currentPlayer)
          gameState.captain1Balance -= gameState.currentBid
        } else {
          gameState.captain2Team.push(currentPlayer)
          gameState.captain2Balance -= gameState.currentBid
        }
      }
      gameState.lastUpdate = Date.now()
    }
  }, 1000)

  return gameState
}

export function stopTimer() {
  gameState.timerActive = false
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  gameState.lastUpdate = Date.now()
  return gameState
}

export function placeBid(amount, captain) {
  const captainBalance = captain === "captain1" ? gameState.captain1Balance : gameState.captain2Balance

  if (amount > gameState.currentBid && amount <= captainBalance && gameState.timerActive) {
    gameState.currentBid = amount
    gameState.highestBidder = captain
    gameState.lastUpdate = Date.now()
    return { success: true, gameState }
  }

  return { success: false, gameState }
}

export function nextPlayer() {
  // Assign current player if there's a bid
  if (gameState.highestBidder && gameState.currentBid > 0) {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    currentPlayer.soldTo = gameState.highestBidder
    currentPlayer.soldPrice = gameState.currentBid

    if (gameState.highestBidder === "captain1") {
      gameState.captain1Team.push(currentPlayer)
      gameState.captain1Balance -= gameState.currentBid
    } else {
      gameState.captain2Team.push(currentPlayer)
      gameState.captain2Balance -= gameState.currentBid
    }
  }

  // Move to next player
  gameState.currentPlayerIndex++
  gameState.currentBid = 0
  gameState.highestBidder = null
  gameState.timerActive = false
  gameState.timeRemaining = 60

  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }

  if (gameState.currentPlayerIndex >= gameState.players.length) {
    endAuction()
  }

  gameState.lastUpdate = Date.now()
  return gameState
}

export function endAuction() {
  gameState.auctionEnded = true
  gameState.auctionActive = false
  gameState.timerActive = false

  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }

  gameState.lastUpdate = Date.now()
  return gameState
}
