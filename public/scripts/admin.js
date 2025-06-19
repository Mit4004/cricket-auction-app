const socket = io()
let gameState = {}

// Check authentication
const userRole = sessionStorage.getItem("userRole")
if (userRole !== "admin") {
  window.location.href = "index.html"
}

// Re-authenticate with server
socket.emit("authenticate", { role: "admin", pin: "12345" })

function logout() {
  sessionStorage.removeItem("userRole")
  window.location.href = "index.html"
}

function addPlayer() {
  const name = document.getElementById("playerName").value.trim()
  const role = document.getElementById("playerRole").value

  if (!name) {
    alert("Please enter player name")
    return
  }

  socket.emit("addPlayer", { name, role })

  // Clear form
  document.getElementById("playerName").value = ""
}

function setBalances() {
  const captain1Balance = Number.parseInt(document.getElementById("captain1Balance").value)
  const captain2Balance = Number.parseInt(document.getElementById("captain2Balance").value)

  if (captain1Balance < 0 || captain2Balance < 0) {
    alert("Balances must be positive")
    return
  }

  socket.emit("setBalances", { captain1: captain1Balance, captain2: captain2Balance })
}

function startTimer() {
  if (gameState.players.length === 0) {
    alert("Please add players first")
    return
  }

  socket.emit("startTimer")
}

function stopTimer() {
  socket.emit("stopTimer")
}

function nextPlayer() {
  socket.emit("nextPlayer")
}

function endAuction() {
  if (confirm("Are you sure you want to end the auction?")) {
    socket.emit("endAuction")
  }
}

// Socket event listeners
socket.on("gameState", (state) => {
  gameState = state
  updateUI()
})

socket.on("timerUpdate", (timeRemaining) => {
  updateTimer(timeRemaining)
})

socket.on("newBid", (bidData) => {
  showNotification(
    `New bid: ₹${bidData.amount.toLocaleString()} by ${bidData.captain === "captain1" ? "Captain 1" : "Captain 2"}`,
  )
})

socket.on("playerSold", (data) => {
  const captainName = data.soldTo === "captain1" ? "Captain 1" : "Captain 2"
  showNotification(`${data.player.name} sold to ${captainName} for ₹${data.price.toLocaleString()}`)
})

socket.on("auctionEnded", () => {
  showNotification("Auction has ended!")
  updateUI()
})

function updateUI() {
  // Update players list
  const playersList = document.getElementById("playersList")
  playersList.innerHTML = ""

  gameState.players.forEach((player, index) => {
    const playerDiv = document.createElement("div")
    playerDiv.className = "player-item"

    let status = "Available"
    if (player.soldTo) {
      status = `Sold to ${player.soldTo === "captain1" ? "Captain 1" : "Captain 2"} for ₹${player.soldPrice.toLocaleString()}`
    } else if (index === gameState.currentPlayerIndex) {
      status = "Current Player"
    }

    playerDiv.innerHTML = `
            <div>
                <strong>${player.name}</strong> - ${player.role}
                <br><small>${status}</small>
            </div>
        `

    playersList.appendChild(playerDiv)
  })

  // Update status display
  const statusDisplay = document.getElementById("statusDisplay")
  if (gameState.auctionEnded) {
    statusDisplay.innerHTML = `
            <h4>Auction Ended</h4>
            <p>Captain 1 Team: ${gameState.captain1Team.length} players</p>
            <p>Captain 2 Team: ${gameState.captain2Team.length} players</p>
        `
  } else if (gameState.auctionActive && gameState.players.length > 0) {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    statusDisplay.innerHTML = `
            <h4>Current Player: ${currentPlayer ? currentPlayer.name : "None"}</h4>
            <p>Current Bid: ₹${gameState.currentBid.toLocaleString()}</p>
            <p>Highest Bidder: ${gameState.highestBidder ? (gameState.highestBidder === "captain1" ? "Captain 1" : "Captain 2") : "None"}</p>
            <p>Timer: ${gameState.timerActive ? "Running" : "Stopped"}</p>
            <p>Captain 1 Balance: ₹${gameState.captain1Balance.toLocaleString()}</p>
            <p>Captain 2 Balance: ₹${gameState.captain2Balance.toLocaleString()}</p>
        `
  } else {
    statusDisplay.innerHTML = "<p>No auction active</p>"
  }

  // Update current player display
  const currentPlayerSection = document.getElementById("currentPlayerSection")
  const currentPlayerCard = document.getElementById("currentPlayerCard")

  if (gameState.auctionActive && gameState.players.length > 0 && !gameState.auctionEnded) {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    if (currentPlayer) {
      currentPlayerSection.style.display = "block"
      currentPlayerCard.innerHTML = `
                <div class="player-image">🏏</div>
                <div class="player-name">${currentPlayer.name}</div>
                <div class="player-role">${currentPlayer.role}</div>
            `
    }
  } else {
    currentPlayerSection.style.display = "none"
  }

  // Update button states
  document.getElementById("startBtn").disabled = gameState.timerActive || gameState.auctionEnded
  document.getElementById("stopBtn").disabled = !gameState.timerActive || gameState.auctionEnded
  document.getElementById("nextBtn").disabled = gameState.auctionEnded
  document.getElementById("endBtn").disabled = gameState.auctionEnded
}

function updateTimer(timeRemaining) {
  const statusDisplay = document.getElementById("statusDisplay")
  if (gameState.auctionActive && !gameState.auctionEnded) {
    const currentContent = statusDisplay.innerHTML
    const timerLine = currentContent.replace(/Timer: \d+/, `Timer: ${timeRemaining}`)
    statusDisplay.innerHTML = timerLine
  }
}

function showNotification(message) {
  // Create notification element
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
        animation: slideIn 0.3s ease-out;
    `
  notification.textContent = message

  document.body.appendChild(notification)

  // Remove after 3 seconds
  setTimeout(() => {
    notification.remove()
  }, 3000)
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Set default balances
  document.getElementById("captain1Balance").value = gameState.captain1Balance || 1000000
  document.getElementById("captain2Balance").value = gameState.captain2Balance || 1000000
})
