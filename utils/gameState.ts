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
    timeRemaining: 0,
    auctionActive: false,
    auctionEnded: false,
    lastUpdate: Date.now(),
  };
  
  export function getGameState() {
    return gameState;
  }
  
  export function saveGameState(state) {
    gameState = { ...state, lastUpdate: Date.now() };
  }
  