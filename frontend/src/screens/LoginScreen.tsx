import React, { useState } from 'react'
import { Eye, EyeOff, Shield, User, AlertCircle } from 'lucide-react'
import { ENV } from '../config/environment'

interface LoginScreenProps {
  onLoginSuccess: (user: any, role: string) => void
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if account is locked
    if (isLocked) {
      setError('Account is temporarily locked. Please try again later.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Simple secure authentication (credentials should be set securely in production)
      const validUsers = {
        'owner': { 
          role: 'owner', 
          password: 'owner123', 
          name: 'Owner' 
        },
        'staff': { 
          role: 'staff', 
          password: 'staff123', 
          name: 'Staff' 
        }
      }

      const userData = validUsers[username as keyof typeof validUsers]
      
      if (!userData || userData.password !== password) {
        const newAttempts = loginAttempts + 1
        setLoginAttempts(newAttempts)
        
        const maxAttempts = ENV.MAX_LOGIN_ATTEMPTS
        if (newAttempts >= maxAttempts) {
          setIsLocked(true)
          const lockoutDuration = ENV.LOCKOUT_DURATION
          setTimeout(() => {
            setIsLocked(false)
            setLoginAttempts(0)
          }, lockoutDuration)
          throw new Error(`Too many failed attempts. Account locked for ${lockoutDuration / 60000} minutes.`)
        }
        
        throw new Error(`Invalid username or password. ${maxAttempts - newAttempts} attempts remaining.`)
      }

      // Create user object
      const user = {
        id: `user-${username}`,
        username: username,
        name: userData.name,
        role: userData.role
      }

      // Reset login attempts on successful login
      setLoginAttempts(0)
      console.log('Login successful:', { username, role: userData.role })
      onLoginSuccess(user, userData.role)
      
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Milk Delivery</h1>
          <p className="text-gray-600">Secure access to your delivery system</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="bg-white p-6 rounded-xl shadow-lg space-y-4 border border-gray-200">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                id="username"
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="owner or staff"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="w-full px-4 py-3 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading || isLocked}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing in...
              </>
            ) : isLocked ? (
              'Account Locked'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

      </div>
    </div>
  )
}
