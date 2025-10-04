import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api-simple'
import { useAppActions } from '../context/AppContext'

interface UseApiOptions {
  enabled?: boolean
  refetchOnMount?: boolean
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  deps: any[] = [],
  options: UseApiOptions = {}
) {
  const { enabled = true, refetchOnMount = true } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const { addNotification } = useAppActions()

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await apiCall()
      setData(result)
    } catch (err: any) {
      setError(err)
      addNotification({
        type: 'error',
        message: err.message || 'An API error occurred',
        autoHide: true
      })
    } finally {
      setLoading(false)
    }
  }, [apiCall, enabled, addNotification, ...deps])

  useEffect(() => {
    if (refetchOnMount) {
      fetchData()
    }
  }, [fetchData, refetchOnMount])

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch }
}

// Specific hooks for common data types
export function useShops(options?: UseApiOptions) {
  return useApi(() => api.getShops(), [], options)
}

export function useDeliveryBoys(options?: UseApiOptions) {
  return useApi(() => api.getDeliveryBoys(), [], options)
}

export function useMilkTypes(options?: UseApiOptions) {
  return useApi(() => api.getMilkTypes(), [], options)
}

export function useDeliveries(date?: string, options?: UseApiOptions) {
  return useApi(() => api.getDeliveries(date), [date], options)
}

export function useTodayCollection(date?: string, options?: UseApiOptions) {
  return useApi(() => api.getTodayCollection(date), [date], options)
}

export function useReportsCollection(date: string, options?: UseApiOptions) {
  return useApi(() => api.getReportsCollection(date), [date], options)
}

export function useReportsDailySummary(date: string, options?: UseApiOptions) {
  return useApi(() => api.getReportsDailySummary(date), [date], options)
}

export function useShopDetail(shopId: string, date: string, functionName: string, options?: UseApiOptions) {
  return useApi(() => api.getShopDetail(shopId, date, functionName), [shopId, date, functionName], options)
}

export function useShopBalance(shopId: string, options?: UseApiOptions) {
  return useApi(() => api.getShopBalance(shopId), [shopId], options)
}

// Mutation hooks
export function useAddDelivery() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { addNotification } = useAppActions()

  const mutate = useCallback(async (deliveryData: any) => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.addDelivery(deliveryData)
      addNotification({
        type: 'success',
        message: 'Delivery added successfully!',
        autoHide: true
      })
      return response
    } catch (err: any) {
      setError(err)
      addNotification({
        type: 'error',
        message: err.message || 'Failed to add delivery',
        autoHide: true
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  return { mutate, loading, error }
}

export function useProcessPayment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { addNotification } = useAppActions()

  const mutate = useCallback(async (paymentData: any) => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.processPayment(paymentData)
      addNotification({
        type: 'success',
        message: 'Payment processed successfully!',
        autoHide: true
      })
      return response
    } catch (err: any) {
      setError(err)
      addNotification({
        type: 'error',
        message: err.message || 'Failed to process payment',
        autoHide: true
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  return { mutate, loading, error }
}

export function useMarkPayTomorrow() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { addNotification } = useAppActions()

  const mutate = useCallback(async (shopId: string, notes?: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.markPayTomorrow(shopId, notes)
      addNotification({
        type: 'success',
        message: 'Payment marked for tomorrow!',
        autoHide: true
      })
      return response
    } catch (err: any) {
      setError(err)
      addNotification({
        type: 'error',
        message: err.message || 'Failed to mark payment for tomorrow',
        autoHide: true
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  return { mutate, loading, error }
}

export function useProcessDailyReset() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { addNotification } = useAppActions()

  const mutate = useCallback(async (date?: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.processDailyReset(date)
      addNotification({
        type: 'success',
        message: 'Daily reset completed successfully!',
        autoHide: true
      })
      return response
    } catch (err: any) {
      setError(err)
      addNotification({
        type: 'error',
        message: err.message || 'Failed to process daily reset',
        autoHide: true
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  return { mutate, loading, error }
}
