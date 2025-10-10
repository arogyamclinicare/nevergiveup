import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { SessionManager } from '../utils/sessionManager'

// Types
export interface User {
  id: string
  username: string
  role: 'owner' | 'staff'
  name: string
}

export interface AppState {
  // Authentication
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Data
  shops: any[]
  deliveryBoys: any[]
  milkTypes: any[]
  deliveries: any[]
  payments: any[]
  
  // UI State
  activeTab: string
  refreshTriggers: {
    shops: number
    reports: number
  }
  
  // Error handling
  error: string | null
  notifications: Notification[]
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  timestamp: number
  autoHide?: boolean
}

// Action Types
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_SHOPS'; payload: any[] }
  | { type: 'SET_DELIVERY_BOYS'; payload: any[] }
  | { type: 'SET_MILK_TYPES'; payload: any[] }
  | { type: 'SET_DELIVERIES'; payload: any[] }
  | { type: 'SET_PAYMENTS'; payload: any[] }
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'TRIGGER_REFRESH'; payload: 'shops' | 'reports' }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'timestamp'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }

// Initial State
const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  shops: [],
  deliveryBoys: [],
  milkTypes: [],
  deliveries: [],
  payments: [],
  activeTab: 'shops',
  refreshTriggers: {
    shops: 0,
    reports: 0
  },
  error: null,
  notifications: []
}

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_USER':
      return { ...state, user: action.payload }
    
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload }
    
    case 'SET_SHOPS':
      return { ...state, shops: action.payload }
    
    case 'SET_DELIVERY_BOYS':
      return { ...state, deliveryBoys: action.payload }
    
    case 'SET_MILK_TYPES':
      return { ...state, milkTypes: action.payload }
    
    case 'SET_DELIVERIES':
      return { ...state, deliveries: action.payload }
    
    case 'SET_PAYMENTS':
      return { ...state, payments: action.payload }
    
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload }
    
    case 'TRIGGER_REFRESH':
      return {
        ...state,
        refreshTriggers: {
          ...state.refreshTriggers,
          [action.payload]: state.refreshTriggers[action.payload] + 1
        }
      }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    
    case 'ADD_NOTIFICATION':
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: Date.now()
      }
      return {
        ...state,
        notifications: [...state.notifications, notification]
      }
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      }
    
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] }
    
    default:
      return state
  }
}

// Context
const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

// Provider Component
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        
        // Check for existing session
        const session = SessionManager.getSession()
        if (session) {
          dispatch({ type: 'SET_USER', payload: session.user })
          dispatch({ type: 'SET_AUTHENTICATED', payload: true })
          
          // Load initial data
          await loadInitialData()
        }
      } catch (error) {
        console.error('App initialization error:', error)
        dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize app' })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    initializeApp()
  }, [])

  // Load initial data
  const loadInitialData = async () => {
    try {
      // Load shops
      const { data: shops } = await supabase
        .from('shops')
        .select('*')
        .eq('is_active', true)
        .order('name')
      dispatch({ type: 'SET_SHOPS', payload: shops || [] })

      // Load delivery boys
      const { data: deliveryBoys } = await supabase
        .from('delivery_boys')
        .select('*')
        .eq('is_active', true)
        .order('name')
      dispatch({ type: 'SET_DELIVERY_BOYS', payload: deliveryBoys || [] })

      // Load milk types
      const { data: milkTypes } = await supabase
        .from('milk_types')
        .select('*')
        .eq('is_active', true)
        .order('name')
      dispatch({ type: 'SET_MILK_TYPES', payload: milkTypes || [] })
    } catch (error) {
      console.error('Error loading initial data:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load initial data' })
    }
  }

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

// Custom Hook
export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

// Action Creators
export const useAppActions = () => {
  const { dispatch } = useApp()

  return {
    setLoading: (loading: boolean) => 
      dispatch({ type: 'SET_LOADING', payload: loading }),
    
    setUser: (user: User | null) => 
      dispatch({ type: 'SET_USER', payload: user }),
    
    setAuthenticated: (authenticated: boolean) => 
      dispatch({ type: 'SET_AUTHENTICATED', payload: authenticated }),
    
    setShops: (shops: any[]) => 
      dispatch({ type: 'SET_SHOPS', payload: shops }),
    
    setDeliveryBoys: (deliveryBoys: any[]) => 
      dispatch({ type: 'SET_DELIVERY_BOYS', payload: deliveryBoys }),
    
    setMilkTypes: (milkTypes: any[]) => 
      dispatch({ type: 'SET_MILK_TYPES', payload: milkTypes }),
    
    setDeliveries: (deliveries: any[]) => 
      dispatch({ type: 'SET_DELIVERIES', payload: deliveries }),
    
    setPayments: (payments: any[]) => 
      dispatch({ type: 'SET_PAYMENTS', payload: payments }),
    
    setActiveTab: (tab: string) => 
      dispatch({ type: 'SET_ACTIVE_TAB', payload: tab }),
    
    triggerRefresh: (type: 'shops' | 'reports') => 
      dispatch({ type: 'TRIGGER_REFRESH', payload: type }),
    
    setError: (error: string | null) => 
      dispatch({ type: 'SET_ERROR', payload: error }),
    
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => 
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification }),
    
    removeNotification: (id: string) => 
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: id }),
    
    clearNotifications: () => 
      dispatch({ type: 'CLEAR_NOTIFICATIONS' })
  }
}
