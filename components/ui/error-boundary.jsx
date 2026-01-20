"use client"

import { Component, ReactNode } from "react"
import { AlertCircle } from "lucide-react"

// Define Props and State as regular JavaScript objects
const Props = {
  children: ReactNode,
}

const State = {
  hasError: false,
  error: null,
}

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error) {
    console.error("Error caught:", error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F] flex items-center justify-center p-4">
          <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl p-8 max-w-md w-full text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#F5F5F5] mb-2">Something went wrong</h2>
            <p className="text-sm text-[#B8C5D6] mb-6">{this.state.error?.message || "An unexpected error occurred"}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-[#FFD700] text-[#0A1A2F] rounded-lg font-bold hover:bg-[#FFD700]/90 transition-all"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
