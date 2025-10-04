import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Store, Clock, DollarSign, TrendingUp } from 'lucide-react'

interface HomeScreenProps {
  onDeliveryRefresh?: () => void
  onCollectionRefresh?: () => void
}

interface RouteStats {
  delivered: number
  collected: number
  pending: number
  shopsVisited: number
  totalShops: number
}

export default function HomeScreen({ onDeliveryRefresh, onCollectionRefresh }: HomeScreenProps) {
  // Props are used in useEffect dependencies
  const [routeStats, setRouteStats] = useState<RouteStats>({
    delivered: 0,
    collected: 0,
    pending: 0,
    shopsVisited: 0,
    totalShops: 0
  })
  const [loading, setLoading] = useState(true)

  const fetchRouteStats = async () => {
    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]
      
      // Get today's deliveries
      const { data: deliveries } = await supabase
        .from('deliveries')
        .select('shop_id, total_amount, payment_amount, delivery_status')
        .eq('delivery_date', today)
        .eq('is_archived', false)

      // Get total shops
      const { data: shops } = await supabase
        .from('shops')
        .select('id')
        .eq('is_active', true)

      // Get collection data
      const { data: collectionData } = await supabase
        .rpc('get_collection_view', { p_date: today })


      const delivered = deliveries?.reduce((sum, d) => sum + Number(d.total_amount), 0) || 0
      const collected = deliveries?.reduce((sum, d) => sum + Number(d.payment_amount), 0) || 0
      const pending = collectionData?.reduce((sum: number, c: any) => sum + Number(c.total_pending), 0) || 0
      // Count shops that have any deliveries (regardless of status) as visited
      const shopsVisited = new Set(deliveries?.map(d => d.shop_id) || []).size
      const totalShops = shops?.length || 0

      setRouteStats({
        delivered,
        collected,
        pending,
        shopsVisited,
        totalShops
      })
    } catch (error) {
      console.error('Error fetching route stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRouteStats()
  }, [])

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })

  const progressPercentage = routeStats.totalShops > 0 ? (routeStats.shopsVisited / routeStats.totalShops) * 100 : 0

  return (
    <div className="p-4 bg-gray-50 min-h-screen" data-testid="home-screen">

      {/* Today's Route Card */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 mb-6 border border-purple-200">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-purple-900 mb-1">Today's Route</h2>
          <p className="text-sm text-purple-700">{currentDate}</p>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {/* Delivered */}
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Delivered</p>
            <p className="text-lg font-bold text-green-600">₹{routeStats.delivered.toFixed(2)}</p>
          </div>

          {/* Collected */}
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Collected</p>
            <p className="text-lg font-bold text-blue-600">₹{routeStats.collected.toFixed(2)}</p>
          </div>

          {/* Pending */}
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-lg font-bold text-orange-600">₹{routeStats.pending.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Route Progress Card */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
            <Store className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Route Progress</h3>
            <p className="text-sm text-gray-600">Shops Visited</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold text-gray-900">
            {routeStats.shopsVisited}/{routeStats.totalShops}
          </span>
          <span className="text-sm text-gray-600">{progressPercentage.toFixed(0)}% Complete</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
}

