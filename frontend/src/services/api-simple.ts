import { supabase } from '../lib/supabase'

// Simple API service without complex caching for production build
export const api = {
  // Shops
  async getShops() {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('is_active', true)
      .order('name')
    if (error) throw error
    return data
  },

  async getShopById(id: string) {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  // Delivery Boys
  async getDeliveryBoys() {
    const { data, error } = await supabase
      .from('delivery_boys')
      .select('*')
      .eq('is_active', true)
      .order('name')
    if (error) throw error
    return data
  },

  // Milk Types
  async getMilkTypes() {
    const { data, error } = await supabase
      .from('milk_types')
      .select('*')
      .eq('is_active', true)
      .order('name')
    if (error) throw error
    return data
  },

  // Deliveries
  async addDelivery(deliveryData: any) {
    const { data, error } = await supabase.rpc('add_delivery', {
      p_shop_id: deliveryData.shop_id,
      p_delivery_boy_id: deliveryData.delivery_boy_id,
      p_products: deliveryData.products,
      p_notes: deliveryData.notes
    })
    if (error) throw error
    return data
  },

  async getDeliveries(date?: string) {
    const { data, error } = await supabase
      .from('deliveries')
      .select('*')
      .eq('delivery_date', date || new Date().toISOString().split('T')[0])
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  // Payments
  async processPayment(paymentData: any) {
    const { data, error } = await supabase.rpc('process_payment', {
      p_shop_id: paymentData.shop_id,
      p_amount: paymentData.amount,
      p_collected_by: paymentData.collected_by,
      p_notes: paymentData.notes
    })
    if (error) throw error
    return data
  },

  async markPayTomorrow(shopId: string, notes?: string) {
    const { data, error } = await supabase.rpc('mark_pay_tomorrow', {
      p_shop_id: shopId,
      p_notes: notes
    })
    if (error) throw error
    return data
  },

  // Collection Views
  async getTodayCollection(date?: string) {
    const { data, error } = await supabase.rpc('get_today_collection_view', {
      p_date: date || new Date().toISOString().split('T')[0]
    })
    if (error) throw error
    return data
  },

  async getReportsCollection(date: string) {
    const { data, error } = await supabase.rpc('get_reports_collection_view', {
      p_date: date
    })
    if (error) throw error
    return data
  },

  async getReportsDailySummary(date: string) {
    const { data, error } = await supabase.rpc('get_reports_daily_summary', {
      p_date: date
    })
    if (error) throw error
    return data
  },

  // Shop Details
  async getShopDetail(shopId: string, date: string, functionName: string) {
    const { data, error } = await supabase.rpc(functionName, {
      p_shop_id: shopId,
      p_date: date
    })
    if (error) throw error
    return data
  },

  // Daily Reset
  async processDailyReset(date?: string) {
    const { data, error } = await supabase.rpc('process_daily_reset', {
      p_date: date || new Date().toISOString().split('T')[0]
    })
    if (error) throw error
    return data
  },

  // Shop Balance
  async getShopBalance(shopId: string) {
    const { data, error } = await supabase.rpc('get_shop_balance', {
      p_shop_id: shopId
    })
    if (error) throw error
    return data
  }
}

// Simple cache invalidation
export const invalidateCache = (pattern?: string) => {
  // Simple implementation - just log for now
  // Cache invalidated
}
