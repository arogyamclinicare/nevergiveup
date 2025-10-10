import { useState, useEffect, useCallback } from 'react'
import { AppProvider, useApp, useAppActions } from './context/AppContext'
import AppLayout from './components/Layout/AppLayout'
import BottomNav from './components/Layout/BottomNav'
import NotificationSystem from './components/NotificationSystem'
import { 
  HomeScreen, 
  SettingsScreen
} from './components/lazy/LazyScreens'
import ShopsScreen from './screens/ShopsScreen'
import ShopDetailScreen from './screens/ShopDetailScreen'
import PaymentModal from './screens/PaymentModal'
import { Shop, CollectionViewRow } from './lib/supabase'
import { SessionManager } from './utils/sessionManager'

// Tab type is defined in AppContext
type ShopsView = 'shops-list' | 'shop-detail'

function AppContent() {
  const { state } = useApp()
  const { setActiveTab, setUser, setAuthenticated, addNotification, triggerRefresh } = useAppActions()
  
  const [shopsView, setShopsView] = useState<ShopsView>('shops-list')
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null)
  const [selectedCollectionShop, setSelectedCollectionShop] = useState<CollectionViewRow | null>(null)
  // Success messages handled by NotificationSystem

  // Authentication handlers
  const handleLogout = useCallback(() => {
    setUser(null)
    setAuthenticated(false)
    setActiveTab('home')
    SessionManager.clearSession()
    addNotification({
      type: 'info',
      message: 'Logged out successfully',
      autoHide: true
    })
  }, [addNotification, setUser, setAuthenticated, setActiveTab])

  // Session timeout watcher
  useEffect(() => {
    if (state.isAuthenticated) {
      const cleanup = SessionManager.startSessionWatcher(() => {
        handleLogout()
        addNotification({
          type: 'warning',
          message: 'Session expired. Please login again.',
          autoHide: true
        })
      })
      return cleanup
    }
  }, [state.isAuthenticated, addNotification, handleLogout])

  const handleSelectShop = (shop: Shop) => {
    setSelectedShop(shop)
    setShopsView('shop-detail')
  }

  const handleBackToShopList = () => {
    setSelectedShop(null)
    setShopsView('shops-list')
    // Trigger refresh to update shop list with latest data
    triggerRefresh('shops')
  }



  const renderContent = () => {
    // Shops Tab Logic
    if (state.activeTab === 'shops') {
      if (shopsView === 'shop-detail' && selectedShop) {
        return (
          <ShopDetailScreen
            shopId={selectedShop.id}
            onBack={handleBackToShopList}
          />
        )
      }
      
      return (
        <AppLayout 
          title="Shops" 
          showLogoutButton={state.user?.role === 'staff'} 
          onLogout={handleLogout}
        >
          <ShopsScreen 
            onSelectShop={handleSelectShop} 
            refreshTrigger={state.refreshTriggers.shops}
          />
        </AppLayout>
      )
    }

    // Other Tabs
    switch (state.activeTab) {
      case 'home':
        return (
          <AppLayout 
            title="Milk Delivery App" 
            showLogoutButton={state.user?.role === 'staff'} 
            onLogout={handleLogout}
          >
            <HomeScreen 
              onDeliveryRefresh={() => triggerRefresh('shops')}
              onCollectionRefresh={() => triggerRefresh('shops')}
              refreshTrigger={state.refreshTriggers.shops}
            />
          </AppLayout>
        )
      case 'settings':
        return (
          <AppLayout 
            title="Settings" 
            showLogoutButton={state.user?.role === 'staff'} 
            onLogout={handleLogout}
          >
            <SettingsScreen userRole={state.user?.role} onLogout={handleLogout} />
          </AppLayout>
        )
      default:
        return null
    }
  }

  // Skip login for demo - go directly to shops
  // if (!state.isAuthenticated) {
  //   return <LoginScreen onLoginSuccess={handleLoginSuccess} />
  // }

  return (
    <div className="h-screen overflow-hidden">
      {renderContent()}
      <BottomNav 
        activeTab={state.activeTab as 'home' | 'shops' | 'settings'} 
        onTabChange={setActiveTab}
        userRole={state.user?.role}
        onLogout={handleLogout}
      />
      
      {/* Payment Modal */}
      {selectedCollectionShop && (
        <PaymentModal
          shop={selectedCollectionShop}
          onClose={() => setSelectedCollectionShop(null)}
          onSuccess={() => {
            addNotification({
              type: 'success',
              message: 'Payment processed successfully!',
              autoHide: true
            })
            setSelectedCollectionShop(null)
            triggerRefresh('shops')
          }}
        />
      )}
      
      {/* Notification System */}
      <NotificationSystem />
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
