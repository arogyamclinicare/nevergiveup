import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Package, DollarSign, Clock, User, Phone, MapPin, FileText, CheckCircle, AlertCircle, Truck, CreditCard } from 'lucide-react'

interface ShopDetailData {
  shop_id: string
  shop_name: string
  shop_owner: string
  shop_phone: string
  shop_address: string
  delivery_date: string
  total_delivered: number
  total_paid: number
  total_pending: number
  delivery_count: number
  products_delivered: any[]
  payment_history: any[]
  delivery_notes: string
}

interface ShopDetailScreenProps {
  shopId: string
  date: string
  onBack: () => void
}

export default function ShopDetailScreen({ shopId, date, onBack }: ShopDetailScreenProps) {
  const [shopData, setShopData] = useState<ShopDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchShopDetail()
  }, [shopId, date])

  const fetchShopDetail = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.rpc('get_shop_detail_view', {
        p_shop_id: shopId,
        p_date: date
      })

      if (error) throw error

      if (data && data.length > 0) {
        setShopData(data[0])
      } else {
        setError('No data found for this shop and date')
      }
    } catch (err: any) {
      console.error('Error fetching shop detail:', err)
      setError(err.message || 'Failed to load shop details')
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading shop details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-3">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{error}</p>
          <button
            onClick={fetchShopDetail}
            className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!shopData) {
    return (
      <div className="p-3">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">{shopData.shop_name}</h1>
          <p className="text-xs text-gray-500">{new Date(shopData.delivery_date).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Shop Info */}
      <div className="bg-white rounded-lg p-3 border border-gray-100">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Owner: {shopData.shop_owner}</span>
          </div>
          {shopData.shop_phone && (
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">{shopData.shop_phone}</span>
            </div>
          )}
          {shopData.shop_address && (
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">{shopData.shop_address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-xs text-blue-600 font-medium">Delivered</p>
          <p className="text-sm font-bold text-blue-800">
            {formatCurrency(shopData.total_delivered)}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-xs text-green-600 font-medium">Paid</p>
          <p className="text-sm font-bold text-green-800">
            {formatCurrency(shopData.total_paid)}
          </p>
        </div>
        <div className="bg-orange-50 rounded-lg p-3 text-center">
          <p className="text-xs text-orange-600 font-medium">Pending</p>
          <p className="text-sm font-bold text-orange-800">
            {formatCurrency(shopData.total_pending)}
          </p>
        </div>
      </div>


      {/* Products Delivered */}
      {shopData.products_delivered && shopData.products_delivered.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-100">
          <div className="p-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center">
              <Package className="w-4 h-4 mr-2" />
              Products Delivered ({shopData.delivery_count})
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {shopData.products_delivered.map((delivery: any, index: number) => (
              <div key={delivery.delivery_id || index} className="p-3">
                {/* Delivery Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Truck className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-900">
                      Delivery #{index + 1}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {delivery.payment_status === 'paid' && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {delivery.payment_status === 'partial' && (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                    {delivery.payment_status === 'pending' && (
                      <Clock className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      delivery.payment_status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : delivery.payment_status === 'partial'
                        ? 'bg-yellow-100 text-yellow-700'
                        : delivery.payment_status === 'pay_tomorrow'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {delivery.payment_status === 'paid' ? 'Fully Paid' : 
                       delivery.payment_status === 'partial' ? 'Partially Paid' :
                       delivery.payment_status === 'pay_tomorrow' ? 'Pay Tomorrow' :
                       'Pending Payment'}
                    </span>
                  </div>
                </div>
                
                {/* Products List */}
                {delivery.products && Array.isArray(delivery.products) && (
                  <div className="bg-gray-50 rounded-lg p-2 mb-3">
                    <div className="space-y-1">
                      {delivery.products.map((product: any, pIndex: number) => (
                        <div key={pIndex} className="flex justify-between text-xs">
                          <span className="text-gray-700">
                            {product.name} x {product.quantity}
                          </span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(product.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Financial Summary */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-blue-50 rounded p-2 text-center">
                    <p className="text-xs text-blue-600">Total Amount</p>
                    <p className="text-sm font-bold text-blue-800">
                      {formatCurrency(delivery.total_amount)}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded p-2 text-center">
                    <p className="text-xs text-green-600">Amount Paid</p>
                    <p className="text-sm font-bold text-green-800">
                      {formatCurrency(delivery.payment_amount)}
                    </p>
                  </div>
                </div>
                
                {/* Delivery & Collection Info */}
                <div className="space-y-2">
                  {delivery.delivery_boy && (
                    <div className="flex items-center space-x-2 text-xs">
                      <Truck className="w-3 h-3 text-blue-500" />
                      <span className="text-gray-600">Delivered by:</span>
                      <span className="font-medium text-gray-900">{delivery.delivery_boy}</span>
                    </div>
                  )}
                  
                  {delivery.delivered_at && (
                    <div className="flex items-center space-x-2 text-xs">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-600">Delivered at:</span>
                      <span className="font-medium text-gray-900">
                        {formatDateTime(delivery.delivered_at)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History */}
      {shopData.payment_history && shopData.payment_history.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-100">
          <div className="p-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />
              Payment Collection History
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {shopData.payment_history.map((payment: any, index: number) => (
              <div key={payment.payment_id || index} className="p-3">
                {/* Payment Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDateTime(payment.created_at)}
                  </span>
                </div>
                
                {/* Collection Info */}
                <div className="bg-green-50 rounded-lg p-2 mb-2">
                  <div className="flex items-center space-x-2 text-xs">
                    <User className="w-3 h-3 text-green-600" />
                    <span className="text-green-700">Collected by:</span>
                    <span className="font-medium text-green-800">{payment.collected_by}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs mt-1">
                    <Clock className="w-3 h-3 text-green-600" />
                    <span className="text-green-700">Payment Date:</span>
                    <span className="font-medium text-green-800">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {/* Notes */}
                {payment.notes && (
                  <div className="bg-gray-50 rounded p-2">
                    <div className="flex items-start space-x-2 text-xs">
                      <FileText className="w-3 h-3 text-gray-500 mt-0.5" />
                      <div>
                        <span className="text-gray-600">Note:</span>
                        <p className="text-gray-700 mt-1">{payment.notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delivery Notes */}
      {shopData.delivery_notes && (
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center mb-2">
            <FileText className="w-4 h-4 mr-2" />
            Delivery Notes
          </h3>
          <p className="text-sm text-gray-600">{shopData.delivery_notes}</p>
        </div>
      )}

      {/* No Data Message */}
      {shopData.delivery_count === 0 && (
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No deliveries on this date</p>
        </div>
      )}
    </div>
  )
}
