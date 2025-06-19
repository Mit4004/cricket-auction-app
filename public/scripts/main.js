const socket = io()
let selectedRole = null

function selectRole(role) {
  selectedRole = role

  if (role === "spectator") {
    // Spectators don't need PIN
    window.location.href = "spectator.html"
  } else {
    // Show PIN modal for admin and captains
    document.getElementById("pinModal").style.display = "block"
    document.getElementById("pinInput").focus()
  }
}

function closeModal() {
  document.getElementById("pinModal").style.display = "none"
  document.getElementById("pinInput").value = ""
  selectedRole = null
}

function authenticate() {
  const pin = document.getElementById("pinInput").value

  if (pin.length !== 5) {
    alert("Please enter a 5-digit PIN")
    return
  }

  socket.emit("authenticate", { role: selectedRole, pin: pin })
}

// Handle authentication response
socket.on("authenticated", (data) => {
  if (data.success) {
    // Store role in sessionStorage
    sessionStorage.setItem("userRole", data.role)

    // Redirect to appropriate page
    switch (data.role) {
      case "admin":
        window.location.href = "admin.html"
        break
      case "captain1":
      case "captain2":
        window.location.href = "captain.html"
        break
      case "spectator":
        window.location.href = "spectator.html"
        break
    }
  } else {
    alert("Invalid PIN. Please try again.")
    document.getElementById("pinInput").value = ""
    document.getElementById("pinInput").focus()
  }
})

// Handle Enter key in PIN input
document.addEventListener("DOMContentLoaded", () => {
  const pinInput = document.getElementById("pinInput")
  if (pinInput) {
    pinInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        authenticate()
      }
    })
  }

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    const modal = document.getElementById("pinModal")
    if (e.target === modal) {
      closeModal()
    }
  })
})
