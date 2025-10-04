import { useState, useEffect, useCallback, useRef } from 'react'
import { apiService, ApiResponse } from '../services/api'
import { useAppActions } from '../context/AppContext'

interface UseApiOptions {
  enabled?: boolean
  refetchOnMount?: boolean
  cacheTime?: number
  staleTime?: number
}

interface UseApiResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  mutate: (data: T) => void
}

// Custom hook for API calls with caching and error handling
export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  dependencies: any[] = [],
  options: UseApiOptions = {}
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { addNotification } = useAppActions()
  const mountedRef = useRef(true)

  const {
    enabled = true,
    refetchOnMount = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 1 * 60 * 1000 // 1 minute
  } = options

  const fetchData = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)

      const response = await apiCall()

      if (!mountedRef.current) return

      if (response.success) {
        setData(response.data)
      } else {
        setError(response.error || 'Unknown error occurred')
        addNotification({
          type: 'error',
          message: response.error || 'Failed to fetch data',
          autoHide: true
        })
      }
    } catch (err) {
      if (!mountedRef.current) return

      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      addNotification({
        type: 'error',
        message: `API Error: ${errorMessage}`,
        autoHide: true
      })
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [apiCall, enabled, addNotification])

  const refetch = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  const mutate = useCallback((newData: T) => {
    setData(newData)
  }, [])

  useEffect(() => {
    if (refetchOnMount) {
      fetchData()
    }
  }, [fetchData, refetchOnMount, ...dependencies])

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  return {
    data,
    loading,
    error,
    refetch,
    mutate
  }
}

// Specific hooks for common API calls
export function useShops() {
  return useApi(() => apiService.getShops(), [])
}

export function useDeliveryBoys() {
  return useApi(() => apiService.getDeliveryBoys(), [])
}

export function useMilkTypes() {
  return useApi(() => apiService.getMilkTypes(), [])
}

export function useDeliveries(date?: string) {
  return useApi(() => apiService.getDeliveries(date), [date])
}

export function useCollectionView(date?: string) {
  return useApi(() => apiService.getCollectionView(date), [date])
}

export function useReportsCollectionView(date: string) {
  return useApi(() => apiService.getReportsCollectionView(date), [date])
}

export function useReportsDailySummary(date: string) {
  return useApi(() => apiService.getReportsDailySummary(date), [date])
}

export function useShopDetailView(shopId: string, date: string, isReport: boolean = false) {
  return useApi(() => apiService.getShopDetailView(shopId, date, isReport), [shopId, date, isReport])
}

export function useShopBalance(shopId: string) {
  return useApi(() => apiService.getShopBalance(shopId), [shopId])
}

// Mutation hooks for data modification
export function useAddDelivery() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { addNotification, triggerRefresh } = useAppActions()

  const addDelivery = useCallback(async (deliveryData: {
    shop_id: string
    delivery_boy_id: string
    products: any[]
    delivery_date?: string
    notes?: string
  }) => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiService.addDelivery(deliveryData)

      if (response.success) {
        addNotification({
          type: 'success',
          message: 'Delivery added successfully',
          autoHide: true
        })
        triggerRefresh('delivery')
        return response.data
      } else {
        throw new Error(response.error || 'Failed to add delivery')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      addNotification({
        type: 'error',
        message: `Failed to add delivery: ${errorMessage}`,
        autoHide: true
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [addNotification, triggerRefresh])

  return {
    addDelivery,
    loading,
    error
  }
}

export function useProcessPayment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { addNotification, triggerRefresh } = useAppActions()

  const processPayment = useCallback(async (paymentData: {
    shop_id: string
    amount: number
    collected_by?: string
    payment_date?: string
    notes?: string
  }) => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiService.processPayment(paymentData)

      if (response.success) {
        addNotification({
          type: 'success',
          message: 'Payment processed successfully',
          autoHide: true
        })
        triggerRefresh('collection')
        return response.data
      } else {
        throw new Error(response.error || 'Failed to process payment')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      addNotification({
        type: 'error',
        message: `Failed to process payment: ${errorMessage}`,
        autoHide: true
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [addNotification, triggerRefresh])

  return {
    processPayment,
    loading,
    error
  }
}

export function useMarkPayTomorrow() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { addNotification, triggerRefresh } = useAppActions()

  const markPayTomorrow = useCallback(async (shopId: string, notes?: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiService.markPayTomorrow(shopId, notes)

      if (response.success) {
        addNotification({
          type: 'success',
          message: 'Payment deferred to tomorrow',
          autoHide: true
        })
        triggerRefresh('collection')
        return response.data
      } else {
        throw new Error(response.error || 'Failed to defer payment')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      addNotification({
        type: 'error',
        message: `Failed to defer payment: ${errorMessage}`,
        autoHide: true
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [addNotification, triggerRefresh])

  return {
    markPayTomorrow,
    loading,
    error
  }
}

export function useProcessDailyReset() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { addNotification, triggerRefresh } = useAppActions()

  const processDailyReset = useCallback(async (date?: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiService.processDailyReset(date)

      if (response.success) {
        addNotification({
          type: 'success',
          message: 'Daily reset completed successfully',
          autoHide: true
        })
        triggerRefresh('delivery')
        triggerRefresh('collection')
        triggerRefresh('reports')
        return response.data
      } else {
        throw new Error(response.error || 'Failed to process daily reset')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      addNotification({
        type: 'error',
        message: `Failed to process daily reset: ${errorMessage}`,
        autoHide: true
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [addNotification, triggerRefresh])

  return {
    processDailyReset,
    loading,
    error
  }
}
