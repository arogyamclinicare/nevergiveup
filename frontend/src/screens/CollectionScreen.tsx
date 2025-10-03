import { useState, useEffect } from 'react'
import { supabase, CollectionViewRow } from '../lib/supabase'
import { ChevronRight, AlertCircle, CheckCircle, Clock } from 'lucide-react'

interface CollectionScreenProps {
  onSelectShop: (shop: CollectionViewRow) => void
  refreshTrigger?: number // Add refresh trigger prop
}

export default function CollectionScreen({ onSelectShop, refreshTrigger }: CollectionScreenProps) {
  const [shops, setShops] = useState<CollectionViewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPendingOnly, setShowPendingOnly] = useState(false)

  useEffect(() => {
    fetchCollectionView()
  }, [])

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      fetchCollectionView()
    }
  }, [refreshTrigger])

  const fetchCollectionView = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use collection view function (combines today's + historical pending)
      const functionName = 'get_collection_view'
      
      const { data, error } = await supabase.rpc(functionName, {
        p_date: new Date().toISOString().split('T')[0] // Today's date
      })
      
      if (error) throw error
      
      setShops(data || [])
    } catch (err: any) {
      console.error('Error fetching collection view:', err)
      setError(err.message || 'Failed to load collection data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'partial':
        return <CheckCircle className="w-5 h-5 text-blue-600" />
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'pay_tomorrow':
        return <Clock className="w-5 h-5 text-purple-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-50 border-green-200'
      case 'partial':
        return 'bg-blue-50 border-blue-200'
      case 'pending':
        return 'bg-red-50 border-red-200'
      case 'pay_tomorrow':
        return 'bg-purple-50 border-purple-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Fully Paid'
      case 'partial':
        return 'Partially Paid'
      case 'pending':
        return 'Pending Payment'
      case 'pay_tomorrow':
        return 'Pay Tomorrow'
      default:
        return 'Unknown'
    }
  }

  const hasTodayDeliveries = shops.some(shop => shop.today_delivered > 0)

  const filteredShops = showPendingOnly
    ? shops.filter(shop => shop.total_pending > 0)
    : hasTodayDeliveries
      ? shops.filter(shop => shop.today_delivered > 0)
      : [] // Empty array when no shops have today's deliveries

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading collection data...</p>
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
            onClick={fetchCollectionView}
            className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (shops.length === 0 || filteredShops.length === 0) {
    const hasHistoricalPending = shops.some(shop => shop.old_pending > 0)

    return (
      <div className="p-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">
            {hasHistoricalPending && !hasTodayDeliveries
              ? "No deliveries today"
              : hasTodayDeliveries
              ? "All deliveries completed"
              : "No pending payments"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {hasHistoricalPending && !hasTodayDeliveries
              ? "Add deliveries in the Delivery tab first"
              : hasTodayDeliveries
              ? "All shops have been processed today"
              : "All shops are up to date"}
          </p>
          {hasHistoricalPending && hasTodayDeliveries && (
            <div className="mt-3">
              <button
                onClick={() => setShowPendingOnly(true)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View Historical Pending →
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4" data-testid="collection-view">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Collection</h2>
        <p className="text-sm text-gray-600">Collect payments from shops</p>
      </div>

      {/* Filter Toggle */}
      <div className="mb-4">
        <button
          onClick={() => setShowPendingOnly(!showPendingOnly)}
          className={`w-full px-4 py-2 rounded-lg border font-medium transition-colors ${
            showPendingOnly
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-gray-50 border-gray-200 text-gray-700'
          }`}
        >
          {showPendingOnly ? 'Show Pending List' : 'Show Today Only'}
        </button>
      </div>

      {/* Shops List */}
      <div className="space-y-3">
        {filteredShops.map((shop) => (
          <button
            key={shop.shop_id}
            onClick={() => onSelectShop(shop)}
            className={`w-full p-4 rounded-lg border transition-colors ${getStatusColor(shop.status)} hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(shop.status)}
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">{shop.shop_name}</h3>
                  {shop.shop_owner && (
                    <p className="text-sm text-gray-600">Owner: {shop.shop_owner}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {getStatusText(shop.status)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  ₹{Number(shop.total_pending).toFixed(2)}
                </div>
                {showPendingOnly ? (
                  <>
                    {shop.today_pending > 0 && (
                      <div className="text-xs text-gray-600">
                        Today: ₹{Number(shop.today_pending).toFixed(2)}
                      </div>
                    )}
                    {shop.old_pending > 0 && (
                      <div className="text-xs text-gray-600">
                        Old: ₹{Number(shop.old_pending).toFixed(2)}
                      </div>
                    )}
                    {(Number(shop.total_pending) - Number(shop.today_pending) - Number(shop.old_pending)) > 0 && (
                      <div className="text-xs text-orange-600">
                        History: ₹{(Number(shop.total_pending) - Number(shop.today_pending) - Number(shop.old_pending)).toFixed(2)}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {shop.today_pending > 0 && (
                      <div className="text-xs text-gray-600">
                        Today: ₹{Number(shop.today_pending).toFixed(2)}
                      </div>
                    )}
                    {shop.old_pending > 0 && (
                      <div className="text-xs text-gray-600">
                        Old: ₹{Number(shop.old_pending).toFixed(2)}
                      </div>
                    )}
                    {(Number(shop.total_pending) - Number(shop.today_pending) - Number(shop.old_pending)) > 0 && (
                      <div className="text-xs text-orange-600">
                        History: ₹{(Number(shop.total_pending) - Number(shop.today_pending) - Number(shop.old_pending)).toFixed(2)}
                      </div>
                    )}
                  </>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 ml-2" />
            </div>
          </button>
        ))}
      </div>

      {/* Summary */}
      {shops.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-800">
              {showPendingOnly ? 'Total Pending:' : 'Today\'s Deliveries:'}
            </span>
            <span className="text-lg font-bold text-blue-900">
              ₹{filteredShops.reduce((sum, shop) => sum + Number(shop.total_pending), 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-blue-700">
              {showPendingOnly ? 'Shops with pending:' : 'Shops with deliveries:'}
            </span>
            <span className="text-sm font-semibold text-blue-800">
              {filteredShops.length}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
