import { ENV } from '../config/environment'

// Session Management Utility
export class SessionManager {
  private static readonly SESSION_KEY = 'milk_delivery_session'
  private static readonly TIMEOUT_KEY = 'milk_delivery_timeout'
  private static readonly SESSION_TIMEOUT = ENV.SESSION_TIMEOUT

  static setSession(user: any, role: string): void {
    const sessionData = {
      user,
      role,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.SESSION_TIMEOUT
    }
    
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData))
    localStorage.setItem(this.TIMEOUT_KEY, sessionData.expiresAt.toString())
  }

  static getSession(): { user: any; role: string } | null {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY)
      if (!sessionData) return null

      const parsed = JSON.parse(sessionData)
      const now = Date.now()

      // Check if session has expired
      if (now > parsed.expiresAt) {
        this.clearSession()
        return null
      }

      return { user: parsed.user, role: parsed.role }
    } catch (error) {
      console.error('Error getting session:', error)
      this.clearSession()
      return null
    }
  }

  static isSessionValid(): boolean {
    const session = this.getSession()
    return session !== null
  }

  static clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY)
    localStorage.removeItem(this.TIMEOUT_KEY)
  }

  static getTimeRemaining(): number {
    const timeout = localStorage.getItem(this.TIMEOUT_KEY)
    if (!timeout) return 0

    const expiresAt = parseInt(timeout)
    const now = Date.now()
    return Math.max(0, expiresAt - now)
  }

  static extendSession(): void {
    const session = this.getSession()
    if (session) {
      this.setSession(session.user, session.role)
    }
  }

  // Auto-logout when session expires
  static startSessionWatcher(onLogout: () => void): () => void {
    const checkSession = () => {
      if (!this.isSessionValid()) {
        onLogout()
        return
      }
    }

    // Check every minute
    const interval = setInterval(checkSession, 60000)

    // Return cleanup function
    return () => clearInterval(interval)
  }
}
