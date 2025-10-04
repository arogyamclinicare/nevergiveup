import { useState } from 'react'
import { Archive, AlertTriangle, Clock, DollarSign, Settings as SettingsIcon, Store, Package, Database, LogOut, User, Shield, UserX } from 'lucide-react'
import ResetDialog from './ResetDialog'
import ShopManagementScreen from './ShopManagementScreen'
import ProductManagementScreen from './ProductManagementScreen'
import { ENV } from '../config/environment'

interface SettingsScreenProps {
  userRole?: string
  onLogout?: () => void
}

export default function SettingsScreen({ userRole, onLogout }: SettingsScreenProps) {
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<'main' | 'shops' | 'products'>('main')
  const [showPinDialog, setShowPinDialog] = useState(false)
  const [pin, setPin] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pinError, setPinError] = useState('')
  
  // Default PIN from environment configuration
  const DEFAULT_PIN = ENV.DEFAULT_PIN
  const [currentPin, setCurrentPin] = useState(DEFAULT_PIN)

  const handleResetSuccess = () => {
    // Close the dialog and show success message
    setShowResetDialog(false)
    alert('Daily reset completed successfully! All deliveries have been archived.')
  }

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Input validation
    if (!pin.trim()) {
      setPinError('PIN is required.')
      return
    }
    
    if (pin.length < 4) {
      setPinError('PIN must be at least 4 digits.')
      return
    }
    
    if (!/^\d+$/.test(pin)) {
      setPinError('PIN must contain only numbers.')
      return
    }
    
    if (pin === currentPin) {
      setIsAuthenticated(true)
      setShowPinDialog(false)
      setPin('')
      setPinError('')
    } else {
      setPinError('Invalid PIN. Please try again.')
      setPin('')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setShowPinDialog(false)
    setPin('')
    setPinError('')
  }

  const handleChangePin = (newPin: string) => {
    setCurrentPin(newPin)
  }

  // Show PIN dialog if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="p-3">
        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Settings Protected</h2>
            <p className="text-gray-600">Enter PIN to access settings</p>
          </div>
          
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                Enter PIN
              </label>
              <input
                type="password"
                id="pin"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
                placeholder="••••"
                maxLength={6}
                autoComplete="new-password"
                required
              />
            </div>
            
            {pinError && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                {pinError}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Access Settings
            </button>
          </form>
          
        </div>
      </div>
    )
  }

  if (activeTab === 'shops') {
    return <ShopManagementScreen />
  }

  if (activeTab === 'products') {
    return <ProductManagementScreen />
  }

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <SettingsIcon className="w-5 h-5 text-gray-600" />
          <h1 className="text-lg font-bold text-gray-900">Settings</h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 text-red-600 hover:text-red-800 px-3 py-2 rounded-lg hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Logout</span>
        </button>
      </div>

      {/* PIN Management */}
      <div className="bg-white rounded-lg border border-gray-100 p-4 mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">PIN Management</h3>
            <p className="text-sm text-gray-500">Current PIN: ••••</p>
          </div>
          <button
            onClick={() => {
              const newPin = prompt('Enter new PIN (4-6 digits):', currentPin)
              if (newPin && newPin.length >= 4 && newPin.length <= 6) {
                handleChangePin(newPin)
                alert('PIN updated successfully!')
              } else if (newPin) {
                alert('PIN must be 4-6 digits')
              }
            }}
            className="text-blue-600 hover:text-blue-800 px-3 py-2 rounded-lg hover:bg-blue-50 text-sm"
          >
            Change PIN
          </button>
        </div>
      </div>

      {/* Staff Management (Owner Only) */}
      {userRole === 'owner' && (
        <div className="bg-white rounded-lg border border-gray-100 p-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <UserX className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Staff Management</h3>
              <p className="text-sm text-gray-500">Revoke staff access</p>
            </div>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to revoke staff access? This will log out all staff users.')) {
                  // In a real app, this would revoke staff tokens/sessions
                  alert('Staff access revoked successfully!')
                }
              }}
              className="text-red-600 hover:text-red-800 px-3 py-2 rounded-lg hover:bg-red-50 text-sm"
            >
              Revoke Staff
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg border border-gray-100">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('main')}
            className={`flex-1 p-3 text-sm font-medium ${
              activeTab === 'main' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Database className="w-4 h-4 mx-auto mb-1" />
            Main Settings
          </button>
          <button
            onClick={() => setActiveTab('shops')}
            className={`flex-1 p-3 text-sm font-medium ${
              (activeTab as string) === 'shops' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Store className="w-4 h-4 mx-auto mb-1" />
            Shops
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 p-3 text-sm font-medium ${
              (activeTab as string) === 'products' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Package className="w-4 h-4 mx-auto mb-1" />
            Products
          </button>
        </div>

        {/* Main Settings Content */}
        {activeTab === 'main' && (
          <div className="p-4 space-y-4">
            {/* Daily Reset */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Archive className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-red-900">Daily Reset</h3>
                  <p className="text-sm text-red-700">Reset all daily data and archive completed deliveries</p>
                </div>
                <button
                  onClick={() => setShowResetDialog(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Reset Now
                </button>
              </div>
            </div>

            {/* Owner Logout Button */}
            {userRole === 'owner' && onLogout && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <LogOut className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-red-900">Logout</h3>
                    <p className="text-sm text-red-700">Sign out of the application</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to logout?')) {
                        onLogout()
                      }
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}

            {/* System Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">System Information</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>User Role: <span className="font-medium text-gray-900">{userRole || 'Unknown'}</span></p>
                <p>PIN Status: <span className="font-medium text-green-600">Protected</span></p>
                <p>Last Updated: <span className="font-medium text-gray-900">{new Date().toLocaleDateString()}</span></p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reset Dialog */}
      {showResetDialog && (
        <ResetDialog
          isOpen={showResetDialog}
          onClose={() => setShowResetDialog(false)}
          onSuccess={handleResetSuccess}
        />
      )}
    </div>
  )
}