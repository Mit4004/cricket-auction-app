"use client"

import { useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"

let socket: Socket

export default function Home() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [pin, setPin] = useState("")

  useEffect(() => {
    socketInitializer()
    return () => {
      if (socket) socket.disconnect()
    }
  }, [])

  const socketInitializer = async () => {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "", {
      path: "/api/socket",
      addTrailingSlash: false,
    })

    socket.on("authenticated", (data) => {
      if (data.success) {
        sessionStorage.setItem("userRole", data.role)

        switch (data.role) {
          case "admin":
            window.location.href = "/admin"
            break
          case "captain1":
          case "captain2":
            window.location.href = "/captain"
            break
          case "spectator":
            window.location.href = "/spectator"
            break
        }
      } else {
        alert("Invalid PIN. Please try again.")
        setPin("")
      }
    })
  }

  const selectRole = (role: string) => {
    setSelectedRole(role)

    if (role === "spectator") {
      window.location.href = "/spectator"
    } else {
      setShowModal(true)
    }
  }

  const authenticate = () => {
    if (pin.length !== 5) {
      alert("Please enter a 5-digit PIN")
      return
    }

    socket.emit("authenticate", { role: selectedRole, pin })
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
            <h3>Enter PIN</h3>
            <input
              type="password"
              className="pin-input"
              placeholder="Enter 5-digit PIN"
              maxLength={5}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && authenticate()}
            />
            <div className="modal-buttons">
              <button onClick={authenticate} className="btn-primary">
                Enter
              </button>
              <button onClick={closeModal} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
