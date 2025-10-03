import { useState, useEffect } from 'react'
import { supabase, Shop } from '../lib/supabase'
import { ChevronRight, Plus, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface DeliveryStatus {
  shop_id: string
  shop_name: string
  delivery_status: string
  total_deliveries: number
  delivered_count: number
  pending_count: number
  last_delivery_time: string | null
}

interface DeliveryScreenProps {
  onSelectShop: (shop: Shop) => void
  refreshTrigger?: number // Add refresh trigger prop
}

export default function DeliveryScreen({ onSelectShop, refreshTrigger }: DeliveryScreenProps) {
  const [shops, setShops] = useState<Shop[]>([])
  const [deliveryStatuses, setDeliveryStatuses] = useState<DeliveryStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchShops()
    fetchDeliveryStatuses()
  }, [])

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      fetchShops()
      fetchDeliveryStatuses()
    }
  }, [refreshTrigger])

  const fetchShops = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('is_active', true)
        .order('route_number', { ascending: true })
        .order('name', { ascending: true })
      
      if (error) throw error
      
      setShops(data || [])
    } catch (err) {
      console.error('Error fetching shops:', err)
      setError('Failed to load shops')
    } finally {
      setLoading(false)
    }
  }

  const fetchDeliveryStatuses = async () => {
    try {
      const { data, error } = await supabase.rpc('get_shop_delivery_status', {
        p_date: new Date().toISOString().split('T')[0]
      })
      
      if (error) throw error
      
      setDeliveryStatuses(data || [])
    } catch (err) {
      console.error('Error fetching delivery statuses:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shops...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchShops}
            className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (shops.length === 0) {
    return (
      <div className="p-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Plus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No shops found</p>
          <p className="text-sm text-gray-500 mt-1">Add shops in the database first</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4" data-testid="shop-list">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Select Shop</h2>
        <p className="text-sm text-gray-600">Choose a shop to add delivery</p>
      </div>

      <div className="space-y-2">
        {shops.map((shop) => {
          const status = deliveryStatuses.find(s => s.shop_id === shop.id)
          
          const getStatusIcon = () => {
            if (!status || status.total_deliveries === 0) {
              return <Clock className="w-5 h-5 text-gray-400" />
            }
            return <CheckCircle className="w-5 h-5 text-green-600" />
          }

          const getStatusText = () => {
            if (!status || status.total_deliveries === 0) {
              return 'Not Delivered'
            }
            return 'Delivered'
          }

          const getStatusColor = () => {
            if (!status || status.total_deliveries === 0) {
              return 'text-gray-500'
            }
            return 'text-green-600'
          }

          return (
            <button
              key={shop.id}
              onClick={() => onSelectShop(shop)}
              className="w-full bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon()}
                <div className="text-left">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{shop.name}</h3>
                    {shop.route_number && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {shop.route_number}
                      </span>
                    )}
                  </div>
                  {shop.owner_name && (
                    <p className="text-sm text-gray-600">Owner: {shop.owner_name}</p>
                  )}
                  {shop.phone && (
                    <p className="text-sm text-gray-500">{shop.phone}</p>
                  )}
                  <p className={`text-sm font-medium ${getStatusColor()}`}>
                    {getStatusText()}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

