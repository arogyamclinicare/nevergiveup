import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// TypeScript types for our database
export type Shop = {
  id: string
  name: string
  address: string | null
  phone: string | null
  owner_name: string | null
  route_number: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type DeliveryBoy = {
  id: string
  name: string
  phone: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type MilkType = {
  id: string
  name: string
  price_per_packet: number
  is_active: boolean
  created_at: string
}

export type Delivery = {
  id: string
  shop_id: string
  delivery_boy_id: string
  delivery_date: string
  products: Product[]
  total_amount: number
  payment_amount: number
  payment_status: 'paid' | 'partial' | 'pending'
  is_archived: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export type Product = {
  milk_type_id: string
  quantity: number
  price_per_packet: number
  subtotal: number
}

export type CollectionViewRow = {
  shop_id: string
  shop_name: string
  shop_phone: string | null
  shop_owner: string | null
  today_delivered: number
  today_paid: number
  today_pending: number
  old_pending: number
  total_pending: number
  status: 'paid' | 'partial' | 'pending' | 'pay_tomorrow'
  delivery_count: number
}

export type PendingHistoryRow = {
  shop_id: string
  shop_name: string
  shop_phone: string | null
  total_pending: number
  oldest_pending_date: string
  pending_count: number
}

