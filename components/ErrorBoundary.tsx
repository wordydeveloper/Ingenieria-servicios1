"use client"

import React from 'react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mt-5">
          <div className="content-card animate-fadeIn">
            <div className="content-card-body text-center p-5">
              <div className="mb-4">
                <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: '4rem' }}></i>
              </div>
              <h4 className="text-danger fw-bold mb-3">Error en la Aplicación</h4>
              <p className="text-muted mb-4">
                Ha ocurrido un error inesperado. Por favor, recarga la página o contacta al administrador.
              </p>
              <div className="alert alert-danger text-start">
                <strong>Detalles técnicos:</strong>
                <br />
                <code>{this.state.error?.message}</code>
              </div>
              <button 
                className="btn-itla-primary"
                onClick={() => window.location.reload()}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Recargar Página
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
