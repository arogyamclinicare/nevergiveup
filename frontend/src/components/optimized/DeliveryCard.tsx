import React, { memo } from 'react'
import { Truck, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface DeliveryCardProps {
  delivery: {
    id: string
    shop_name: string
    delivery_status: string
    total_amount: number
    pending_amount: number
    route_number?: string
    delivery_boy?: string
    created_at: string
  }
  onClick?: () => void
  className?: string
}

const DeliveryCard = memo<DeliveryCardProps>(({ delivery, onClick, className = '' }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'in_transit':
        return <Truck className="w-5 h-5 text-blue-600" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'pending':
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'in_transit':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'pending':
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
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
            {delivery.shop_name}
          </h3>
          {delivery.delivery_boy && (
            <p className="text-sm text-gray-600 mt-1">
              Delivery Boy: {delivery.delivery_boy}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {getStatusIcon(delivery.delivery_status)}
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(delivery.delivery_status)}`}>
            {formatStatus(delivery.delivery_status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-lg font-semibold text-gray-900">
            ₹{delivery.total_amount.toFixed(2)}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Pending Amount</p>
          <p className="text-lg font-semibold text-orange-600">
            ₹{delivery.pending_amount.toFixed(2)}
          </p>
        </div>
      </div>

      {delivery.route_number && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Route {delivery.route_number}
          </span>
        </div>
      )}
    </div>
  )
})

DeliveryCard.displayName = 'DeliveryCard'

export default DeliveryCard
