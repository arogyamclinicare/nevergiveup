import React, { useState, useEffect } from 'react'
import AppLayout from './components/Layout/AppLayout'
import BottomNav from './components/Layout/BottomNav'
import LoginScreen from './screens/LoginScreen'
import HomeScreen from './screens/HomeScreen'
import DeliveryScreen from './screens/DeliveryScreen'
import AddDeliveryScreen from './screens/AddDeliveryScreen'
import CollectionScreen from './screens/CollectionScreen'
import PaymentModal from './screens/PaymentModal'
import ReportsScreen from './screens/ReportsScreen'
import SettingsScreen from './screens/SettingsScreen'
import { Shop, CollectionViewRow } from './lib/supabase'
import { SessionManager } from './utils/sessionManager'

type Tab = 'home' | 'delivery' | 'collection' | 'reports' | 'settings'
type DeliveryView = 'shop-list' | 'add-delivery'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [deliveryView, setDeliveryView] = useState<DeliveryView>('shop-list')
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null)
  const [selectedCollectionShop, setSelectedCollectionShop] = useState<CollectionViewRow | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [collectionRefreshTrigger, setCollectionRefreshTrigger] = useState(0)
  const [deliveryRefreshTrigger, setDeliveryRefreshTrigger] = useState(0)
  
  // Authentication state
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Initialize session on app start
  useEffect(() => {
    const session = SessionManager.getSession()
    if (session) {
      setUser(session.user)
      setUserRole(session.role)
      setIsAuthenticated(true)
    }
  }, [])

  // Session timeout watcher
  useEffect(() => {
    if (isAuthenticated) {
      const cleanup = SessionManager.startSessionWatcher(() => {
        handleLogout()
        alert('Session expired. Please login again.')
      })
      return cleanup
    }
  }, [isAuthenticated])

  // Authentication handlers
  const handleLoginSuccess = (user: any, role: string) => {
    setUser(user)
    setUserRole(role)
    setIsAuthenticated(true)
    SessionManager.setSession(user, role)
  }

  const handleLogout = () => {
    setUser(null)
    setUserRole('')
    setIsAuthenticated(false)
    setActiveTab('home')
    SessionManager.clearSession()
  }

  const handleSelectShop = (shop: Shop) => {
    setSelectedShop(shop)
    setDeliveryView('add-delivery')
  }

  const handleBackToShopList = () => {
    setSelectedShop(null)
    setDeliveryView('shop-list')
  }

  const handleDeliverySaved = () => {
    setSuccessMessage('✅ Delivery saved successfully!')
    setSelectedShop(null)
    setDeliveryView('shop-list')
    
    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleSelectCollectionShop = (shop: CollectionViewRow) => {
    setSelectedCollectionShop(shop)
  }

  const handlePaymentSuccess = () => {
    setSuccessMessage('✅ Payment processed successfully!')
    setSelectedCollectionShop(null)
    
    // Trigger collection view refresh
    setCollectionRefreshTrigger(prev => prev + 1)
    
    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(null), 3000)
  }


  const renderContent = () => {
    // Delivery Tab Logic
    if (activeTab === 'delivery') {
      if (deliveryView === 'add-delivery' && selectedShop) {
        return (
          <AppLayout 
            title={`Add Delivery`}
            showBackButton
            onBack={handleBackToShopList}
              showLogoutButton={userRole === 'staff'}
              onLogout={handleLogout}
          >
            <AddDeliveryScreen
              shop={selectedShop}
              onBack={handleBackToShopList}
              onSuccess={handleDeliverySaved}
            />
          </AppLayout>
        )
      }
      
        return (
          <AppLayout title="Delivery" showLogoutButton={userRole === 'staff'} onLogout={handleLogout}>
          {successMessage && (
            <div className="mx-4 mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800 font-medium">{successMessage}</p>
            </div>
          )}
          <DeliveryScreen 
            onSelectShop={handleSelectShop} 
            refreshTrigger={deliveryRefreshTrigger}
          />
        </AppLayout>
      )
    }

    // Other Tabs
    switch (activeTab) {
      case 'home':
        return (
          <AppLayout title="Milk Delivery App" showLogoutButton={userRole === 'staff'} onLogout={handleLogout}>
            <HomeScreen 
              onDeliveryRefresh={() => setDeliveryRefreshTrigger(prev => prev + 1)}
              onCollectionRefresh={() => setCollectionRefreshTrigger(prev => prev + 1)}
            />
          </AppLayout>
        )
      case 'collection':
        return (
          <AppLayout title="Collection" showLogoutButton={userRole === 'staff'} onLogout={handleLogout}>
            {successMessage && (
              <div className="mx-4 mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800 font-medium">{successMessage}</p>
              </div>
            )}
            <CollectionScreen 
              onSelectShop={handleSelectCollectionShop} 
              refreshTrigger={collectionRefreshTrigger}
            />
          </AppLayout>
        )
      case 'reports':
        return (
          <AppLayout title="Reports" showLogoutButton={userRole === 'staff'} onLogout={handleLogout}>
            <ReportsScreen />
          </AppLayout>
        )
      case 'settings':
        return (
          <AppLayout title="Settings" showLogoutButton={userRole === 'staff'} onLogout={handleLogout}>
            <SettingsScreen userRole={userRole} onLogout={handleLogout} />
          </AppLayout>
        )
      default:
        return null
    }
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="h-screen overflow-hidden">
      {renderContent()}
      <BottomNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        userRole={userRole}
        onLogout={handleLogout}
      />
      
      {/* Payment Modal */}
      {selectedCollectionShop && (
        <PaymentModal
          shop={selectedCollectionShop}
          onClose={() => setSelectedCollectionShop(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}

export default App
