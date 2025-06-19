import { Server } from "socket.io"

// Game state
const gameState = {
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
}

let timerInterval = null

// Authentication
const PINS = {
  admin: "admin123",
  captain1: "team1",
  captain2: "team2",
}

export default function SocketHandler(req, res) {
  if (res.socket.server.io) {
    console.log("Socket is already running")
  } else {
    console.log("Socket is initializing")
    const io = new Server(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    })
    res.socket.server.io = io

    io.on("connection", (socket) => {
      console.log("User connected:", socket.id)

      // Send current game state to new connection
      socket.emit("gameState", gameState)

      // Authentication
      socket.on("authenticate", (data) => {
        const { role, pin } = data
        let authenticated = false

        if (role === "spectator") {
          authenticated = true
        } else if (PINS[role] && PINS[role] === pin) {
          authenticated = true
        }

        if (authenticated) {
          socket.join(role)
          socket.emit("authenticated", { role, success: true })
          console.log(`${role} authenticated:`, socket.id)
        } else {
          socket.emit("authenticated", { role, success: false })
        }
      })

      // Admin actions
      socket.on("addPlayer", (playerData) => {
        if (socket.rooms.has("admin")) {
          gameState.players.push({
            id: Date.now(),
            name: playerData.name,
            role: playerData.role,
            image: "/images/default-player.jpg",
          })
          io.emit("gameState", gameState)
        }
      })

      socket.on("setBalances", (balances) => {
        if (socket.rooms.has("admin")) {
          gameState.captain1Balance = balances.captain1
          gameState.captain2Balance = balances.captain2
          io.emit("gameState", gameState)
        }
      })

      socket.on("startTimer", () => {
        if (socket.rooms.has("admin") && !gameState.timerActive) {
          gameState.timerActive = true
          gameState.auctionActive = true
          startTimer(io)
          io.emit("gameState", gameState)
        }
      })

      socket.on("stopTimer", () => {
        if (socket.rooms.has("admin")) {
          gameState.timerActive = false
          if (timerInterval) {
            clearInterval(timerInterval)
            timerInterval = null
          }
          io.emit("gameState", gameState)
        }
      })

      socket.on("nextPlayer", () => {
        if (socket.rooms.has("admin")) {
          nextPlayer(io)
        }
      })

      socket.on("endAuction", () => {
        if (socket.rooms.has("admin")) {
          endAuction(io)
        }
      })

      // Captain actions
      socket.on("placeBid", (bidData) => {
        const { amount, captain } = bidData

        if (
          (socket.rooms.has("captain1") && captain === "captain1") ||
          (socket.rooms.has("captain2") && captain === "captain2")
        ) {
          const captainBalance = captain === "captain1" ? gameState.captain1Balance : gameState.captain2Balance

          if (amount > gameState.currentBid && amount <= captainBalance && gameState.timerActive) {
            gameState.currentBid = amount
            gameState.highestBidder = captain
            io.emit("gameState", gameState)
            io.emit("newBid", { amount, captain })
          }
        }
      })

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id)
      })
    })
  }
  res.end()
}

function startTimer(io) {
  gameState.timeRemaining = 60
  timerInterval = setInterval(() => {
    gameState.timeRemaining--
    io.emit("timerUpdate", gameState.timeRemaining)

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

      io.emit("gameState", gameState)
      io.emit("playerSold", {
        player: gameState.players[gameState.currentPlayerIndex],
        soldTo: gameState.highestBidder,
        price: gameState.currentBid,
      })
    }
  }, 1000)
}

function nextPlayer(io) {
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
    endAuction(io)
  } else {
    io.emit("gameState", gameState)
    io.emit("nextPlayer", gameState.players[gameState.currentPlayerIndex])
  }
}

function endAuction(io) {
  gameState.auctionEnded = true
  gameState.auctionActive = false
  gameState.timerActive = false

  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }

  io.emit("gameState", gameState)
  io.emit("auctionEnded", {
    captain1Team: gameState.captain1Team,
    captain2Team: gameState.captain2Team,
  })
}
