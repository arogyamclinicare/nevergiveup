import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Plus, Minus, Save, Package, AlertTriangle } from 'lucide-react'

interface StockManagementScreenProps {
  onBack?: () => void
}

interface StockItem {
  id: string
  product_name: string
  current_quantity: number
  low_stock_threshold: number
}

export default function StockManagementScreen({ onBack }: StockManagementScreenProps) {
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editQuantity, setEditQuantity] = useState<number>(0)
  const [editThreshold, setEditThreshold] = useState<number>(10)

  const loadStockData = async () => {
    try {
      setLoading(true)
      console.log('🔍 STOCK DEBUG - Loading stock data...')
      
      const { data, error } = await supabase
        .from('stock')
        .select('*')
        .order('product_name')

      console.log('🔍 STOCK DEBUG - Supabase response:', { data, error })

      if (error) {
        console.error('❌ STOCK ERROR:', error)
        throw error
      }
      
      console.log('✅ STOCK LOADED - Items:', data?.length || 0)
      setStockItems(data || [])
    } catch (error) {
      console.error('❌ STOCK ERROR - Failed to load:', error)
      alert('Failed to load stock data. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item: StockItem) => {
    setEditingItem(item.id)
    setEditQuantity(item.current_quantity)
    setEditThreshold(item.low_stock_threshold)
  }

  const handleSave = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('stock')
        .update({
          current_quantity: editQuantity,
          low_stock_threshold: editThreshold
        })
        .eq('id', itemId)

      if (error) throw error

      // Update local state
      setStockItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, current_quantity: editQuantity, low_stock_threshold: editThreshold }
            : item
        )
      )

      setEditingItem(null)
    } catch (error) {
      console.error('Error updating stock:', error)
      alert('Failed to update stock. Please try again.')
    }
  }

  const handleDirectSave = async (itemId: string, newQuantity: number) => {
    try {
      const { error } = await supabase
        .from('stock')
        .update({
          current_quantity: newQuantity
        })
        .eq('id', itemId)

      if (error) throw error

      console.log(`✅ STOCK UPDATED - Item ${itemId}: ${newQuantity} units`)
    } catch (error) {
      console.error('Error updating stock:', error)
      alert('Failed to update stock. Please try again.')
    }
  }

  const handleCancel = () => {
    setEditingItem(null)
  }

  const adjustQuantity = (itemId: string, delta: number) => {
    if (editingItem === itemId) {
      setEditQuantity(prev => Math.max(0, prev + delta))
    } else {
      setStockItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, current_quantity: Math.max(0, item.current_quantity + delta) }
            : item
        )
      )
    }
  }

  useEffect(() => {
    loadStockData()
  }, [])

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading stock data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Header - Mobile Compact */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 px-2 py-1 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
          )}
          <h2 className="text-xl font-bold text-gray-900">Stock Management</h2>
        </div>
      </div>

      {/* Stock Items - Mobile Compact */}
      <div className="space-y-2">
        {stockItems.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Stock Items Found</h3>
            <p className="text-gray-500 text-sm">
              Stock items are not loading. Please check your connection or contact support.
            </p>
            <button 
              onClick={loadStockData}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Retry Loading
            </button>
          </div>
        ) : (
          stockItems.map((item) => {
          const isLowStock = item.current_quantity <= item.low_stock_threshold
          const isEditing = editingItem === item.id

          return (
            <div 
              key={item.id}
              className={`bg-white rounded-lg p-3 border-2 ${
                isLowStock ? 'border-red-200 bg-red-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isLowStock ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    <Package className={`w-4 h-4 ${
                      isLowStock ? 'text-red-600' : 'text-green-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm truncate">{item.product_name}</h3>
                    {isLowStock && (
                      <div className="flex items-center space-x-1 text-red-600 text-xs">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Low Stock!</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setEditQuantity(Math.max(0, editQuantity - 1))}
                          className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setEditQuantity(editQuantity + 1)}
                          className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <input
                        type="number"
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-20 text-center font-bold text-sm border-2 border-blue-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        placeholder="0"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => adjustQuantity(item.id, -1)}
                          className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => adjustQuantity(item.id, 1)}
                          className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <input
                        type="number"
                        value={item.current_quantity}
                        onChange={(e) => {
                          const newValue = Math.max(0, parseInt(e.target.value) || 0)
                          setStockItems(prev => 
                            prev.map(stockItem => 
                              stockItem.id === item.id 
                                ? { ...stockItem, current_quantity: newValue }
                                : stockItem
                            )
                          )
                        }}
                        onBlur={(e) => {
                          const newValue = Math.max(0, parseInt(e.target.value) || 0)
                          handleDirectSave(item.id, newValue)
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const newValue = Math.max(0, parseInt(e.currentTarget.value) || 0)
                            handleDirectSave(item.id, newValue)
                            e.currentTarget.blur()
                          }
                        }}
                        className="w-20 text-center font-bold text-sm border-2 border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        placeholder="0"
                      />
                    </div>
                  )}

                  <div className="flex space-x-1">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSave(item.id)}
                          className="flex items-center space-x-1 bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                        >
                          <Save className="w-3 h-3" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={handleCancel}
                          className="bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleEdit(item)}
                        className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <label className="text-xs font-medium text-gray-700">
                      Low Stock Threshold:
                    </label>
                    <input
                      type="number"
                      value={editThreshold}
                      onChange={(e) => setEditThreshold(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-16 text-center border border-gray-300 rounded px-1 py-1 text-xs"
                      min="0"
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })
        )}
      </div>

      {/* Info Card - Mobile Compact */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <Package className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 text-sm">Stock Management Tips</h3>
            <ul className="text-xs text-blue-800 mt-1 space-y-0.5">
              <li>• Stock auto-reduces when delivering milk</li>
              <li>• Red = low stock, Green = good stock</li>
              <li>• Use +/- for small changes, type for large amounts</li>
              <li>• Press Enter or click outside to save</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
