"use client"

import type React from "react"
import { useNotifications } from "@/contexts/NotificationContext"

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications()

  if (notifications.length === 0) return null

  return (
    <div
      className="notification-container position-fixed"
      style={{
        top: "20px",
        right: "20px",
        zIndex: 9999,
        maxWidth: "400px",
      }}
    >
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`alert alert-${getBootstrapType(notification.type)} alert-dismissible fade show mb-3 animate-slideInRight`}
          role="alert"
          style={{
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            border: "none",
            borderRadius: "8px",
          }}
        >
          <div className="d-flex align-items-start">
            <div className="me-2">{getIcon(notification.type)}</div>
            <div className="flex-grow-1">
              <strong className="d-block">{notification.title}</strong>
              <small>{notification.message}</small>
            </div>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => removeNotification(notification.id)}
            aria-label="Close"
          ></button>
        </div>
      ))}
    </div>
  )
}

function getBootstrapType(type: string): string {
  switch (type) {
    case "success":
      return "success"
    case "error":
      return "danger"
    case "warning":
      return "warning"
    case "info":
      return "info"
    default:
      return "primary"
  }
}

function getIcon(type: string): React.ReactNode {
  switch (type) {
    case "success":
      return <i className="bi bi-check-circle-fill text-success"></i>
    case "error":
      return <i className="bi bi-exclamation-triangle-fill text-danger"></i>
    case "warning":
      return <i className="bi bi-exclamation-triangle-fill text-warning"></i>
    case "info":
      return <i className="bi bi-info-circle-fill text-info"></i>
    default:
      return <i className="bi bi-bell-fill text-primary"></i>
  }
}
