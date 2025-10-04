import { supabase } from '../lib/supabase'

// API Response Types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  success: boolean
}

export interface ApiError {
  message: string
  code?: string
  details?: any
}

// Cache Configuration
interface CacheConfig {
  ttl: number // Time to live in milliseconds
  maxSize: number // Maximum cache size
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100
}

// Cache Implementation
class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private config: CacheConfig

  constructor(config: CacheConfig = DEFAULT_CACHE_CONFIG) {
    this.config = config
  }

  set(key: string, data: any): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  clear(): void {
    this.cache.clear()
  }

  delete(key: string): void {
    this.cache.delete(key)
  }
}

// Global cache instance
const apiCache = new ApiCache()

// Retry Configuration
interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000
}

// Retry Logic
async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === config.maxAttempts) {
        throw lastError
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(2, attempt - 1),
        config.maxDelay
      )

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

// API Service Class
export class ApiService {
  private static instance: ApiService
  private cache = apiCache

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService()
    }
    return ApiService.instance
  }

  // Generic API call with caching and retry
  async call<T>(
    operation: () => Promise<T>,
    cacheKey?: string,
    useCache: boolean = true
  ): Promise<ApiResponse<T>> {
    try {
      // Check cache first
      if (useCache && cacheKey) {
        const cachedData = this.cache.get(cacheKey)
        if (cachedData) {
          return {
            success: true,
            data: cachedData
          }
        }
      }

      // Execute operation with retry
      const data = await withRetry(operation)

      // Cache the result
      if (useCache && cacheKey) {
        this.cache.set(cacheKey, data)
      }

      return {
        success: true,
        data
      }
    } catch (error) {
      console.error('API call failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  // Shops API
  async getShops(useCache: boolean = true): Promise<ApiResponse> {
    return this.call(
      () => supabase
        .from('shops')
        .select('*')
        .eq('is_active', true)
        .order('name')
        .then(({ data, error }) => {
          if (error) throw error
          return data
        }),
      'shops',
      useCache
    )
  }

  async getShopById(id: string): Promise<ApiResponse> {
    return this.call(
      () => supabase
        .from('shops')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          if (error) throw error
          return data
        }),
      `shop_${id}`
    )
  }

  // Delivery Boys API
  async getDeliveryBoys(useCache: boolean = true): Promise<ApiResponse> {
    return this.call(
      () => supabase
        .from('delivery_boys')
        .select('*')
        .eq('is_active', true)
        .order('name')
        .then(({ data, error }) => {
          if (error) throw error
          return data
        }),
      'delivery_boys',
      useCache
    )
  }

  // Milk Types API
  async getMilkTypes(useCache: boolean = true): Promise<ApiResponse> {
    return this.call(
      () => supabase
        .from('milk_types')
        .select('*')
        .eq('is_active', true)
        .order('name')
        .then(({ data, error }) => {
          if (error) throw error
          return data
        }),
      'milk_types',
      useCache
    )
  }

  // Deliveries API
  async addDelivery(deliveryData: {
    shop_id: string
    delivery_boy_id: string
    products: any[]
    delivery_date?: string
    notes?: string
  }): Promise<ApiResponse> {
    const result = await this.call(
      () => supabase.rpc('add_delivery', {
        p_shop_id: deliveryData.shop_id,
        p_delivery_boy_id: deliveryData.delivery_boy_id,
        p_products: deliveryData.products,
        p_delivery_date: deliveryData.delivery_date || new Date().toISOString().split('T')[0],
        p_notes: deliveryData.notes
      }).then(({ data, error }) => {
        if (error) throw error
        return data
      })
    )

    // Invalidate relevant caches
    if (result.success) {
      this.cache.delete('deliveries')
      this.cache.delete('collection_view')
    }

    return result
  }

  async getDeliveries(date?: string): Promise<ApiResponse> {
    const cacheKey = `deliveries_${date || 'today'}`
    return this.call(
      () => supabase
        .from('deliveries')
        .select('*')
        .eq('delivery_date', date || new Date().toISOString().split('T')[0])
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) throw error
          return data
        }),
      cacheKey
    )
  }

  // Payments API
  async processPayment(paymentData: {
    shop_id: string
    amount: number
    collected_by?: string
    payment_date?: string
    notes?: string
  }): Promise<ApiResponse> {
    const result = await this.call(
      () => supabase.rpc('process_payment', {
        p_shop_id: paymentData.shop_id,
        p_amount: paymentData.amount,
        p_collected_by: paymentData.collected_by,
        p_payment_date: paymentData.payment_date || new Date().toISOString().split('T')[0],
        p_notes: paymentData.notes
      }).then(({ data, error }) => {
        if (error) throw error
        return data
      })
    )

    // Invalidate relevant caches
    if (result.success) {
      this.cache.delete('payments')
      this.cache.delete('collection_view')
      this.cache.delete('shop_balance')
    }

    return result
  }

  async markPayTomorrow(shopId: string, notes?: string): Promise<ApiResponse> {
    const result = await this.call(
      () => supabase.rpc('mark_pay_tomorrow', {
        p_shop_id: shopId,
        p_notes: notes
      }).then(({ data, error }) => {
        if (error) throw error
        return data
      })
    )

    // Invalidate relevant caches
    if (result.success) {
      this.cache.delete('collection_view')
      this.cache.delete('deliveries')
    }

    return result
  }

  // Collection API
  async getCollectionView(date?: string): Promise<ApiResponse> {
    const cacheKey = `collection_view_${date || 'today'}`
    return this.call(
      () => supabase.rpc('get_today_collection_view', {
        p_date: date || new Date().toISOString().split('T')[0]
      }).then(({ data, error }) => {
        if (error) throw error
        return data
      }),
      cacheKey
    )
  }

  // Reports API
  async getReportsCollectionView(date: string): Promise<ApiResponse> {
    const cacheKey = `reports_collection_${date}`
    return this.call(
      () => supabase.rpc('get_reports_collection_view', {
        p_date: date
      }).then(({ data, error }) => {
        if (error) throw error
        return data
      }),
      cacheKey
    )
  }

  async getReportsDailySummary(date: string): Promise<ApiResponse> {
    const cacheKey = `reports_summary_${date}`
    return this.call(
      () => supabase.rpc('get_reports_daily_summary', {
        p_date: date
      }).then(({ data, error }) => {
        if (error) throw error
        return data
      }),
      cacheKey
    )
  }

  async getShopDetailView(shopId: string, date: string, isReport: boolean = false): Promise<ApiResponse> {
    const cacheKey = `shop_detail_${shopId}_${date}_${isReport ? 'report' : 'active'}`
    const functionName = isReport ? 'get_reports_shop_detail_view' : 'get_shop_detail_view'
    
    return this.call(
      () => supabase.rpc(functionName, {
        p_shop_id: shopId,
        p_date: date
      }).then(({ data, error }) => {
        if (error) throw error
        return data
      }),
      cacheKey
    )
  }

  // Reset API
  async processDailyReset(date?: string): Promise<ApiResponse> {
    const result = await this.call(
      () => supabase.rpc('process_daily_reset', {
        p_date: date || new Date().toISOString().split('T')[0]
      }).then(({ data, error }) => {
        if (error) throw error
        return data
      })
    )

    // Clear all caches after reset
    if (result.success) {
      this.cache.clear()
    }

    return result
  }

  // Shop Balance API
  async getShopBalance(shopId: string): Promise<ApiResponse> {
    const cacheKey = `shop_balance_${shopId}`
    return this.call(
      () => supabase.rpc('get_shop_balance', {
        p_shop_id: shopId
      }).then(({ data, error }) => {
        if (error) throw error
        return data
      }),
      cacheKey
    )
  }

  // Cache Management
  clearCache(): void {
    this.cache.clear()
  }

  clearCacheByPattern(pattern: string): void {
    // This would require implementing pattern matching in the cache
    // For now, we'll clear all caches
    this.cache.clear()
  }
}

// Export singleton instance
export const apiService = ApiService.getInstance()

// Export individual API functions for backward compatibility
export const api = {
  getShops: () => apiService.getShops(),
  getDeliveryBoys: () => apiService.getDeliveryBoys(),
  getMilkTypes: () => apiService.getMilkTypes(),
  addDelivery: (data: any) => apiService.addDelivery(data),
  processPayment: (data: any) => apiService.processPayment(data),
  markPayTomorrow: (shopId: string, notes?: string) => apiService.markPayTomorrow(shopId, notes),
  getCollectionView: (date?: string) => apiService.getCollectionView(date),
  getReportsCollectionView: (date: string) => apiService.getReportsCollectionView(date),
  getReportsDailySummary: (date: string) => apiService.getReportsDailySummary(date),
  getShopDetailView: (shopId: string, date: string, isReport?: boolean) => 
    apiService.getShopDetailView(shopId, date, isReport),
  processDailyReset: (date?: string) => apiService.processDailyReset(date),
  getShopBalance: (shopId: string) => apiService.getShopBalance(shopId)
}
