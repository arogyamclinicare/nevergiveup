interface HomeScreenProps {
  onDeliveryRefresh?: () => void
  onCollectionRefresh?: () => void
}

export default function HomeScreen({ onDeliveryRefresh, onCollectionRefresh }: HomeScreenProps) {
  return (
    <div className="p-4" data-testid="home-screen">
      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to Milk Delivery App
        </h2>
        <p className="text-gray-600">
          Manage daily milk deliveries, collect payments, and track business performance.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-3xl font-bold text-blue-600 mb-1">0</div>
          <div className="text-sm text-blue-800">Today's Deliveries</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-3xl font-bold text-green-600 mb-1">₹0</div>
          <div className="text-sm text-green-800">Collected Today</div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="text-3xl font-bold text-orange-600 mb-1">₹0</div>
          <div className="text-sm text-orange-800">Pending Total</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="text-3xl font-bold text-purple-600 mb-1">0</div>
          <div className="text-sm text-purple-800">Active Shops</div>
        </div>
      </div>

      <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
        <p className="text-sm text-yellow-800">
          <span className="font-semibold">Quick Start:</span> Use the Delivery tab to add today's deliveries, then Collection tab to collect payments!
        </p>
      </div>
    </div>
  )
}

