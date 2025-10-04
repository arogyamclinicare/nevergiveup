import React, { memo } from 'react'
import { MapPin, Phone, User } from 'lucide-react'

interface ShopCardProps {
  shop: {
    id: string
    name: string
    owner_name?: string
    phone?: string
    address?: string
    route_number?: number
  }
  onClick?: () => void
  className?: string
}

const ShopCard = memo<ShopCardProps>(({ shop, onClick, className = '' }) => {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {shop.name}
          </h3>
          
          {shop.owner_name && (
            <div className="flex items-center space-x-2 mt-1">
              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-600 truncate">
                {shop.owner_name}
              </span>
            </div>
          )}
          
          {shop.phone && (
            <div className="flex items-center space-x-2 mt-1">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-600">
                {shop.phone}
              </span>
            </div>
          )}
          
          {shop.address && (
            <div className="flex items-center space-x-2 mt-1">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-600 truncate">
                {shop.address}
              </span>
            </div>
          )}
        </div>
        
        {shop.route_number && (
          <div className="flex-shrink-0 ml-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Route {shop.route_number}
            </span>
          </div>
        )}
      </div>
    </div>
  )
})

ShopCard.displayName = 'ShopCard'

export default ShopCard
