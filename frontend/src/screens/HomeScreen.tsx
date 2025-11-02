import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Store, Clock, DollarSign, TrendingUp, Package, Edit3, Save, X, Plus, Minus, Calendar } from 'lucide-react'

interface HomeScreenProps {
  onDeliveryRefresh?: () => void
  onCollectionRefresh?: () => void
  refreshTrigger?: number
}

interface RouteStats {
  delivered: number
  collected: number
  pending: number
  shopsVisited: number
  totalShops: number
}

interface StockItem {
  id: string
  product_name: string
  current_quantity: number
  low_stock_threshold: number
}

export default function HomeScreen({ onDeliveryRefresh, onCollectionRefresh, refreshTrigger }: HomeScreenProps) {
  // Props are used in useEffect dependencies
  const [routeStats, setRouteStats] = useState<RouteStats>({
    delivered: 0,
    collected: 0,
    pending: 0,
    shopsVisited: 0,
    totalShops: 0
  })
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditingStock, setIsEditingStock] = useState(false)
  const [editingQuantities, setEditingQuantities] = useState<{[key: string]: number}>({})
  const [simulatingTomorrow, setSimulatingTomorrow] = useState(false)

  const fetchStockData = async () => {
    try {
      const { data, error } = await supabase
        .from('stock')
        .select('*')
        .order('product_name')

      if (error) throw error
      setStockItems(data || [])
    } catch (error) {
      console.error('Error fetching stock data:', error)
    }
  }

  const startEditingStock = () => {
    const quantities: {[key: string]: number} = {}
    stockItems.forEach(item => {
      quantities[item.id] = item.current_quantity
    })
    setEditingQuantities(quantities)
    setIsEditingStock(true)
  }

  const cancelEditingStock = () => {
    setIsEditingStock(false)
    setEditingQuantities({})
  }

  const updateQuantity = (itemId: string, newQuantity: number) => {
    setEditingQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, newQuantity)
    }))
  }

  const saveStockChanges = async () => {
    try {
      const updates = Object.entries(editingQuantities).map(([itemId, quantity]) => {
        const item = stockItems.find(s => s.id === itemId)
        if (item && item.current_quantity !== quantity) {
          return { id: itemId, current_quantity: quantity }
        }
        return null
      }).filter(Boolean)

      if (updates.length > 0) {
        for (const update of updates) {
          const { error } = await supabase
            .from('stock')
            .update({ current_quantity: update!.current_quantity })
            .eq('id', update!.id)
          
          if (error) throw error
        }
        
        // Refresh stock data
        await fetchStockData()
        alert('Stock updated successfully!')
      }
      
      setIsEditingStock(false)
      setEditingQuantities({})
    } catch (error) {
      console.error('Error updating stock:', error)
      alert('Failed to update stock. Please try again.')
    }
  }

  const fetchRouteStats = async () => {
    try {
      setLoading(true)
      
      // Use the database function for accurate stats (includes all pending from history)
      const { data, error } = await supabase.rpc('get_route_stats')
      
      if (error) throw error
      if (!data || !data.success) {
        throw new Error('Failed to fetch route stats')
      }

      setRouteStats({
        delivered: data.today_delivered || 0,
        collected: data.today_collected || 0,
        pending: data.pending || 0,
        shopsVisited: data.shops_visited || 0,
        totalShops: data.total_shops || 0
      })
    } catch (error) {
      console.error('Error fetching route stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const simulateTomorrow = async () => {
    if (!confirm('Simulate tomorrow? This will archive today\'s deliveries and move pending to history.')) {
      return
    }

    try {
      setSimulatingTomorrow(true)
      
      const { data, error } = await supabase
        .rpc('process_daily_reset', { p_date: new Date().toISOString().split('T')[0] })

      if (error) throw error

      if (data && data.success) {
        alert(`Tomorrow simulated! ${data.processed_deliveries} deliveries processed, ₹${data.total_pending_moved.toFixed(2)} moved to history.`)
        // Refresh stats
        await fetchRouteStats()
        // Trigger parent component refresh
        if (onDeliveryRefresh) onDeliveryRefresh()
        if (onCollectionRefresh) onCollectionRefresh()
      } else {
        throw new Error('Failed to simulate tomorrow')
      }
    } catch (error: any) {
      console.error('Error simulating tomorrow:', error)
      alert('Failed to simulate tomorrow: ' + (error.message || 'Unknown error'))
    } finally {
      setSimulatingTomorrow(false)
    }
  }

  useEffect(() => {
    fetchRouteStats()
    fetchStockData()
  }, [])

  // Refresh when trigger changes
  useEffect(() => {
    if (refreshTrigger) {
      fetchRouteStats()
      fetchStockData()
    }
  }, [refreshTrigger])

  // Daily reset at midnight (12:00 AM)
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      
      // Check if it's exactly midnight (12:00 AM)
      if (hours === 0 && minutes === 0) {
        console.log('Midnight detected - resetting route stats')
        fetchRouteStats()
      }
    }

    // Check every minute for midnight
    const interval = setInterval(checkMidnight, 60000) // 60 seconds

    return () => clearInterval(interval)
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

        {/* Simulate Tomorrow Button */}
        <button
          onClick={simulateTomorrow}
          disabled={simulatingTomorrow}
          className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <Calendar className="w-5 h-5" />
          <span className="font-medium">
            {simulatingTomorrow ? 'Simulating...' : 'Simulate Tomorrow'}
          </span>
        </button>
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

      {/* Stock Status Card */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <Package className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Stock Status</h3>
              <p className="text-sm text-gray-600">Current Inventory</p>
            </div>
          </div>
          
          {!isEditingStock ? (
            <button
              onClick={startEditingStock}
              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span className="text-sm font-medium">Edit</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={cancelEditingStock}
                className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
                <span className="text-sm font-medium">Cancel</span>
              </button>
              <button
                onClick={saveStockChanges}
                className="flex items-center space-x-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span className="text-sm font-medium">Save</span>
              </button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {stockItems.map((item) => {
            const isLowStock = item.current_quantity <= item.low_stock_threshold
            const editingQuantity = editingQuantities[item.id] ?? item.current_quantity
            
            return (
              <div 
                key={item.id}
                className={`p-2 rounded-lg border-2 ${
                  isLowStock 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold truncate ${
                    isLowStock ? 'text-red-800' : 'text-green-800'
                  }`}>
                    {item.product_name}
                  </span>
                  
                  {isEditingStock ? (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => updateQuantity(item.id, editingQuantity - 1)}
                        className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        value={editingQuantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                        className="w-12 text-center text-xs border border-gray-300 rounded px-1 py-0.5"
                        min="0"
                      />
                      <button
                        onClick={() => updateQuantity(item.id, editingQuantity + 1)}
                        className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span className={`text-sm font-bold ${
                      isLowStock ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {item.current_quantity}
                    </span>
                  )}
                </div>
                
                {!isEditingStock && isLowStock && (
                  <div className="text-xs text-red-600 font-medium">
                    Low Stock!
                  </div>
                )}
                
                {isEditingStock && (
                  <div className="text-xs text-gray-500">
                    Threshold: {item.low_stock_threshold}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

