const socket = io()
let gameState = {}
const userRole = sessionStorage.getItem("userRole")

// Check authentication
if (!userRole || (userRole !== "captain1" && userRole !== "captain2")) {
  window.location.href = "index.html"
}

// Re-authenticate with server
const pins = { captain1: "11111", captain2: "22222" }
socket.emit("authenticate", { role: userRole, pin: pins[userRole] })

function logout() {
  sessionStorage.removeItem("userRole")
  window.location.href = "index.html"
}

function placeBid() {
  const bidAmount = Number.parseInt(document.getElementById("bidAmount").value)

  if (!bidAmount || bidAmount <= 0) {
    alert("Please enter a valid bid amount")
    return
  }

  const currentBalance = userRole === "captain1" ? gameState.captain1Balance : gameState.captain2Balance

  if (bidAmount > currentBalance) {
    alert("Insufficient balance!")
    return
  }

  if (bidAmount <= gameState.currentBid) {
    alert("Bid must be higher than current bid")
    return
  }

  if (!gameState.timerActive) {
    alert("Bidding is not active")
    return
  }

  socket.emit("placeBid", { amount: bidAmount, captain: userRole })
  document.getElementById("bidAmount").value = ""
}

function quickBid(amount) {
  const newBid = gameState.currentBid + amount
  document.getElementById("bidAmount").value = newBid
}

// Socket event listeners
socket.on("gameState", (state) => {
  gameState = state
  updateUI()
})

socket.on("timerUpdate", (timeRemaining) => {
  document.getElementById("timer").textContent = timeRemaining

  // Add urgency effect when time is low
  const timerElement = document.getElementById("timer")
  if (timeRemaining <= 10) {
    timerElement.style.color = "#ff4444"
    timerElement.style.animation = "pulse 0.5s infinite"
  } else {
    timerElement.style.color = "#ff6b6b"
    timerElement.style.animation = "none"
  }
})

socket.on("newBid", (bidData) => {
  const bidderName = bidData.captain === "captain1" ? "Captain 1 ⚡" : "Captain 2 🔥"
  showNotification(`New bid: ₹${bidData.amount.toLocaleString()} by ${bidderName}`)

  // Add visual feedback for own bids
  if (bidData.captain === userRole) {
    showSuccessMessage("Bid placed successfully!")
  }
})

socket.on("playerSold", (data) => {
  const captainName = data.soldTo === "captain1" ? "Captain 1 ⚡" : "Captain 2 🔥"
  showNotification(`${data.player.name} sold to ${captainName} for ₹${data.price.toLocaleString()}`)
})

socket.on("nextPlayer", (player) => {
  showNotification(`Next player: ${player.name} (${player.role})`)
  // Add card flip animation
  const playerCard = document.getElementById("playerCard")
  playerCard.style.animation = "slideIn 0.5s ease-out"
})

socket.on("auctionEnded", (data) => {
  showNotification("Auction has ended!")
  updateUI()
})

function updateUI() {
  // Update captain title and balance
  const captainTitle = document.getElementById("captainTitle")
  const balanceElement = document.getElementById("balance")

  if (userRole === "captain1") {
    captainTitle.textContent = "⚡ Captain 1 - Team Lightning"
    balanceElement.textContent = gameState.captain1Balance.toLocaleString()
  } else {
    captainTitle.textContent = "🔥 Captain 2 - Team Thunder"
    balanceElement.textContent = gameState.captain2Balance.toLocaleString()
  }

  // Update auction status
  const auctionStatus = document.getElementById("auctionStatus")
  const playerDisplay = document.getElementById("playerDisplay")
  const teamDisplay = document.getElementById("teamDisplay")

  if (gameState.auctionEnded) {
    auctionStatus.style.display = "none"
    playerDisplay.style.display = "none"
    teamDisplay.style.display = "block"
    updateTeamDisplay()
  } else if (gameState.auctionActive && gameState.players.length > 0) {
    auctionStatus.style.display = "none"
    playerDisplay.style.display = "grid"
    teamDisplay.style.display = "none"
  } else {
    auctionStatus.style.display = "block"
    playerDisplay.style.display = "none"
    teamDisplay.style.display = "none"
    auctionStatus.innerHTML = "<p>Waiting for auction to start...</p>"
  }
}

function updatePlayerDisplay() {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  if (!currentPlayer) return

  // Update player card
  const playerCard = document.getElementById("playerCard")
  playerCard.innerHTML = `
        <div class="player-image">🏏</div>
        <div class="player-name">${currentPlayer.name}</div>
        <div class="player-role">${currentPlayer.role}</div>
    `

  // Update current bid
  document.getElementById("currentBid").textContent = gameState.currentBid.toLocaleString()

  // Update highest bidder
  const highestBidder = document.getElementById("highestBidder")
  if (gameState.highestBidder) {
    const bidderName = gameState.highestBidder === "captain1" ? "Captain 1 ⚡" : "Captain 2 🔥"
    highestBidder.textContent = `Highest bidder: ${bidderName}`

    // Highlight if current user is highest bidder
    if (gameState.highestBidder === userRole) {
      highestBidder.style.color = "#4ecdc4"
      highestBidder.style.fontWeight = "bold"
    } else {
      highestBidder.style.color = "#b0b0b0"
    }
  }
}

// Mock functions for showNotification, showSuccessMessage, and updateTeamDisplay
function showNotification(message) {
  console.log("Notification: " + message)
}

function showSuccessMessage(message) {
  console.log("Success: " + message)
}

function updateTeamDisplay() {
  console.log("Team display updated")
}
