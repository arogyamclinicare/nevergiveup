import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { BarChart3, TrendingUp, DollarSign, Clock, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react'
import ShopDetailScreen from './ShopDetailScreen'

interface DailyReportData {
  total_delivered: number
  total_collected: number
  total_pending: number
  fully_paid_shops: number
  partially_paid_shops: number
  pending_shops: number
  total_shops: number
}

interface ShopSummary {
  shop_id: string
  shop_name: string
  today_delivered: number
  today_paid: number
  today_pending: number
  old_pending: number
  total_pending: number
  status: string
}

export default function ReportsScreen() {
  const [reportData, setReportData] = useState<DailyReportData | null>(null)
  const [shopSummaries, setShopSummaries] = useState<ShopSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [selectedShop, setSelectedShop] = useState<ShopSummary | null>(null)

  useEffect(() => {
    fetchDailyReport()
  }, [selectedDate])

  const fetchDailyReport = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get daily report summary
      const { data: summaryData, error: summaryError } = await supabase.rpc('get_daily_report_summary', {
        p_date: selectedDate
      })

      if (summaryError) throw summaryError

      // Get detailed shop data
      const { data: collectionData, error: collectionError } = await supabase.rpc('get_collection_view', {
        p_date: selectedDate
      })

      if (collectionError) throw collectionError

      // Use summary data from database function
      if (summaryData && summaryData.length > 0) {
        const summary = summaryData[0]
        const reportData: DailyReportData = {
          total_delivered: Number(summary.total_delivered || 0),
          total_collected: Number(summary.total_collected || 0),
          total_pending: Number(summary.total_pending || 0),
          fully_paid_shops: Number(summary.fully_paid_shops || 0),
          partially_paid_shops: Number(summary.partially_paid_shops || 0),
          pending_shops: Number(summary.pending_shops || 0),
          total_shops: Number(summary.total_shops || 0)
        }
        setReportData(reportData)
      }

      setShopSummaries(collectionData || [])
    } catch (err: any) {
      console.error('Error fetching daily report:', err)
      setError(err.message || 'Failed to load daily report')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading daily report...</p>
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
            onClick={fetchDailyReport}
            className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Show shop detail if selected
  if (selectedShop) {
    return (
      <ShopDetailScreen
        shopId={selectedShop.shop_id}
        date={selectedDate}
        onBack={() => setSelectedShop(null)}
      />
    )
  }

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Daily Report</h1>
          <p className="text-xs text-gray-500">{new Date(selectedDate).toLocaleDateString()}</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="text-xs px-2 py-1 border rounded"
        />
      </div>

      {/* Financial Summary - Compact */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-xs text-blue-600 font-medium">Delivered</p>
          <p className="text-sm font-bold text-blue-800">
            {formatCurrency(reportData?.total_delivered || 0)}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-xs text-green-600 font-medium">Collected</p>
          <p className="text-sm font-bold text-green-800">
            {formatCurrency(reportData?.total_collected || 0)}
          </p>
        </div>
        <div className="bg-orange-50 rounded-lg p-3 text-center">
          <p className="text-xs text-orange-600 font-medium">Pending</p>
          <p className="text-sm font-bold text-orange-800">
            {formatCurrency(reportData?.total_pending || 0)}
          </p>
        </div>
      </div>

      {/* Status Summary - Compact */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-green-50 rounded-lg p-2 text-center">
          <p className="text-xs text-green-600">Paid</p>
          <p className="text-lg font-bold text-green-800">{reportData?.fully_paid_shops || 0}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-2 text-center">
          <p className="text-xs text-yellow-600">Partial</p>
          <p className="text-lg font-bold text-yellow-800">{reportData?.partially_paid_shops || 0}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-2 text-center">
          <p className="text-xs text-red-600">Pending</p>
          <p className="text-lg font-bold text-red-800">{reportData?.pending_shops || 0}</p>
        </div>
      </div>

      {/* Shop List - Compact */}
      <div className="space-y-2">
        {shopSummaries.length === 0 ? (
          <div className="text-center py-8">
            <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No data for this date</p>
          </div>
        ) : (
          shopSummaries.map((shop) => (
            <button
              key={shop.shop_id}
              onClick={() => setSelectedShop(shop)}
              className="w-full bg-white rounded-lg p-3 border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">{shop.shop_name}</h4>
                  <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                    <span>D: {formatCurrency(shop.today_delivered)}</span>
                    <span>P: {formatCurrency(shop.today_paid)}</span>
                    {shop.old_pending > 0 && (
                      <span>Old: {formatCurrency(shop.old_pending)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    shop.status === 'paid'
                      ? 'bg-green-100 text-green-700'
                      : shop.status === 'partial'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {shop.status === 'paid' ? 'Paid' : shop.status === 'partial' ? 'Partial' : 'Pending'}
                  </span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(shop.total_pending)}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}