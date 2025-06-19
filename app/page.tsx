"use client"

import { useState } from "react"

export default function Home() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [pin, setPin] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const selectRole = (role: string) => {
    setSelectedRole(role)

    if (role === "spectator") {
      sessionStorage.setItem("userRole", "spectator")
      window.location.href = "/spectator"
    } else {
      setShowModal(true)
    }
  }

  const authenticate = async () => {
    if (!pin.trim()) {
      alert("Please enter a PIN")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: selectedRole, pin }),
      })

      const data = await response.json()

      if (data.success) {
        sessionStorage.setItem("userRole", data.role)
        sessionStorage.setItem("userPin", pin)

        switch (data.role) {
          case "admin":
            window.location.href = "/admin"
            break
          case "captain1":
          case "captain2":
            window.location.href = "/captain"
            break
        }
      } else {
        alert("Invalid PIN. Please try again.")
        setPin("")
      }
    } catch (error) {
      console.error("Authentication error:", error)
      alert("Connection error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setPin("")
    setSelectedRole(null)
  }

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">🏏 CRICKET AUCTION</h1>
        <p className="subtitle">Select your role to join the auction</p>
      </div>

      <div className="role-selection">
        <div className="role-card" onClick={() => selectRole("admin")}>
          <div className="role-icon">👑</div>
          <h3>Admin</h3>
          <p>Control the auction</p>
        </div>

        <div className="role-card" onClick={() => selectRole("captain1")}>
          <div className="role-icon">⚡</div>
          <h3>Captain 1</h3>
          <p>Team Lightning</p>
        </div>

        <div className="role-card" onClick={() => selectRole("captain2")}>
          <div className="role-icon">🔥</div>
          <h3>Captain 2</h3>
          <p>Team Thunder</p>
        </div>

        <div className="role-card" onClick={() => selectRole("spectator")}>
          <div className="role-icon">👁️</div>
          <h3>Spectator</h3>
          <p>Watch the auction</p>
        </div>
      </div>

      {/* PIN Modal */}
      {showModal && (
        <div className="modal" style={{ display: "block" }}>
          <div className="modal-content">
            <h3>Enter PIN for {selectedRole}</h3>
            <input
              type="password"
              className="pin-input"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && authenticate()}
              autoFocus
              disabled={isLoading}
            />
            <div className="modal-buttons">
              <button onClick={authenticate} className="btn-primary" disabled={isLoading}>
                {isLoading ? "Checking..." : "Enter"}
              </button>
              <button onClick={closeModal} className="btn-secondary" disabled={isLoading}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
