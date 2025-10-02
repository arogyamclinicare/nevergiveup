import { useState, useEffect } from 'react'
import { supabase, Shop } from '../lib/supabase'
import { ChevronRight, Plus } from 'lucide-react'

interface DeliveryScreenProps {
  onSelectShop: (shop: Shop) => void
  refreshTrigger?: number // Add refresh trigger prop
}

export default function DeliveryScreen({ onSelectShop, refreshTrigger }: DeliveryScreenProps) {
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchShops()
  }, [])

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      fetchShops()
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
        .order('name')
      
      if (error) throw error
      
      setShops(data || [])
    } catch (err) {
      console.error('Error fetching shops:', err)
      setError('Failed to load shops')
    } finally {
      setLoading(false)
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
        {shops.map((shop) => (
          <button
            key={shop.id}
            onClick={() => onSelectShop(shop)}
            className="w-full bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-between"
          >
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">{shop.name}</h3>
              {shop.owner_name && (
                <p className="text-sm text-gray-600">Owner: {shop.owner_name}</p>
              )}
              {shop.phone && (
                <p className="text-sm text-gray-500">{shop.phone}</p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        ))}
      </div>
    </div>
  )
}

