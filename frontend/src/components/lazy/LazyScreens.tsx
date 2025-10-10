import React, { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="flex flex-col items-center space-y-2">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <p className="text-sm text-gray-600">Loading...</p>
    </div>
  </div>
)

// Lazy load screens
export const LazyHomeScreen = lazy(() => import('../../screens/HomeScreen'))
export const LazySettingsScreen = lazy(() => import('../../screens/SettingsScreen'))
export const LazyAddDeliveryScreen = lazy(() => import('../../screens/AddDeliveryScreen'))
export const LazyShopDetailScreen = lazy(() => import('../../screens/ShopDetailScreen'))

// Wrapped components with Suspense
export const HomeScreen = (props: any) => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazyHomeScreen {...props} />
  </Suspense>
)



export const SettingsScreen = (props: any) => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazySettingsScreen {...props} />
  </Suspense>
)

export const AddDeliveryScreen = (props: any) => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazyAddDeliveryScreen {...props} />
  </Suspense>
)

export const ShopDetailScreen = (props: any) => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazyShopDetailScreen {...props} />
  </Suspense>
)
