import { useState, useEffect } from 'react'
import { AppProvider, useApp, useAppActions } from './context/AppContext'
import AppLayout from './components/Layout/AppLayout'
import BottomNav from './components/Layout/BottomNav'
import NotificationSystem from './components/NotificationSystem'
import LoginScreen from './screens/LoginScreen'
import { 
  HomeScreen, 
  SettingsScreen,
  AddDeliveryScreen
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
  }, [state.isAuthenticated])

  // Authentication handlers
  const handleLoginSuccess = (user: any, role: string) => {
    setUser(user)
    setAuthenticated(true)
    SessionManager.setSession(user, role)
    addNotification({
      type: 'success',
      message: `Welcome back, ${user.name}!`,
      autoHide: true
    })
  }

  const handleLogout = () => {
    setUser(null)
    setAuthenticated(false)
    setActiveTab('home')
    SessionManager.clearSession()
    addNotification({
      type: 'info',
      message: 'Logged out successfully',
      autoHide: true
    })
  }

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

  const handleDeliverySaved = () => {
    addNotification({
      type: 'success',
      message: 'Delivery saved successfully!',
      autoHide: true
    })
    setSelectedShop(null)
    setShopsView('shops-list')
    triggerRefresh('shops')
  }

  const handleSelectCollectionShop = (shop: CollectionViewRow) => {
    setSelectedCollectionShop(shop)
  }

  const handlePaymentSuccess = () => {
    addNotification({
      type: 'success',
      message: 'Payment processed successfully!',
      autoHide: true
    })
    setSelectedCollectionShop(null)
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
        activeTab={state.activeTab as any} 
        onTabChange={setActiveTab}
        userRole={state.user?.role}
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
