import React, { memo } from 'react'
import { DollarSign, Clock, CheckCircle, AlertTriangle } from 'lucide-react'

interface CollectionCardProps {
  shop: {
    shop_id: string
    shop_name: string
    shop_phone?: string
    shop_owner?: string
    today_delivered: number
    today_paid: number
    today_pending: number
    old_pending: number
    total_pending: number
    status: 'paid' | 'partial' | 'pending' | 'pay_tomorrow'
    delivery_count: number
  }
  onClick?: () => void
  className?: string
}

const CollectionCard = memo<CollectionCardProps>(({ shop, onClick, className = '' }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'partial':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'pay_tomorrow':
        return <Clock className="w-5 h-5 text-blue-600" />
      case 'pending':
      default:
        return <DollarSign className="w-5 h-5 text-orange-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'partial':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'pay_tomorrow':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'pending':
      default:
        return 'bg-orange-50 border-orange-200 text-orange-800'
    }
  }

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {shop.shop_name}
          </h3>
          {shop.shop_owner && (
            <p className="text-sm text-gray-600 mt-1">
              Owner: {shop.shop_owner}
            </p>
          )}
          {shop.shop_phone && (
            <p className="text-sm text-gray-600">
              Phone: {shop.shop_phone}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {getStatusIcon(shop.status)}
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(shop.status)}`}>
            {formatStatus(shop.status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-sm text-gray-500">Today Delivered</p>
          <p className="text-lg font-semibold text-gray-900">
            ₹{shop.today_delivered.toFixed(2)}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Today Paid</p>
          <p className="text-lg font-semibold text-green-600">
            ₹{shop.today_paid.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Today Pending</p>
          <p className="text-lg font-semibold text-orange-600">
            ₹{shop.today_pending.toFixed(2)}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Total Pending</p>
          <p className="text-lg font-semibold text-red-600">
            ₹{shop.total_pending.toFixed(2)}
          </p>
        </div>
      </div>

      {shop.old_pending > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-500">Old Pending</p>
          <p className="text-sm font-medium text-red-600">
            ₹{shop.old_pending.toFixed(2)}
          </p>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-100">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {shop.delivery_count} delivery{shop.delivery_count !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
})

CollectionCard.displayName = 'CollectionCard'

export default CollectionCard
