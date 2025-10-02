import { useState, useEffect } from 'react'
import { supabase, Shop, MilkType } from '../lib/supabase'
import { Minus, Plus } from 'lucide-react'

interface AddDeliveryScreenProps {
  shop: Shop
  onBack: () => void
  onSuccess: () => void
}

interface ProductQuantity {
  milk_type_id: string
  name: string
  price: number
  quantity: number
}

export default function AddDeliveryScreen({ shop, onBack, onSuccess }: AddDeliveryScreenProps) {
  const [products, setProducts] = useState<ProductQuantity[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deliveryBoyId, setDeliveryBoyId] = useState<string>('')
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([])

  useEffect(() => {
    fetchMilkTypes()
    fetchDeliveryBoys()
  }, [])

  const fetchMilkTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('milk_types')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      
      const productQuantities: ProductQuantity[] = (data || []).map((mt: MilkType) => ({
        milk_type_id: mt.id,
        name: mt.name,
        price: Number(mt.price_per_packet),
        quantity: 0,
      }))
      
      setProducts(productQuantities)
    } catch (err) {
      console.error('Error fetching milk types:', err)
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const fetchDeliveryBoys = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_boys')
        .select('*')
        .eq('is_active', true)
      
      if (error) throw error
      
      setDeliveryBoys(data || [])
      if (data && data.length > 0) {
        setDeliveryBoyId(data[0].id)
      }
    } catch (err) {
      console.error('Error fetching delivery boys:', err)
    }
  }

  const updateQuantity = (index: number, change: number) => {
    setProducts(prev => prev.map((p, i) => {
      if (i === index) {
        const newQty = Math.max(0, p.quantity + change)
        return { ...p, quantity: newQty }
      }
      return p
    }))
  }

  const setQuantityDirect = (index: number, value: string) => {
    const qty = parseInt(value) || 0
    setProducts(prev => prev.map((p, i) => {
      if (i === index) {
        return { ...p, quantity: Math.max(0, qty) }
      }
      return p
    }))
  }

  const calculateTotal = () => {
    return products.reduce((sum, p) => sum + (p.price * p.quantity), 0)
  }

  const handleSave = async () => {
    // Validate at least one product selected
    const selectedProducts = products.filter(p => p.quantity > 0)
    if (selectedProducts.length === 0) {
      setError('Please select at least one product')
      return
    }

    if (!deliveryBoyId) {
      setError('Please select a delivery boy')
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Prepare products for the function
      const productsForDb = selectedProducts.map(p => ({
        milk_type_id: p.milk_type_id,
        quantity: p.quantity
      }))

      // Call the add_delivery PostgreSQL function
      const { data, error } = await supabase.rpc('add_delivery', {
        p_shop_id: shop.id,
        p_delivery_boy_id: deliveryBoyId,
        p_products: productsForDb
      })

      if (error) throw error

      if (data && data.success) {
        onSuccess()
      } else {
        throw new Error(data?.error || 'Failed to save delivery')
      }
    } catch (err: any) {
      console.error('Error saving delivery:', err)
      setError(err.message || 'Failed to save delivery')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  const total = calculateTotal()
  const hasItems = products.some(p => p.quantity > 0)

  return (
    <div className="flex flex-col h-full" data-testid="product-selection">
      <div className="flex-1 overflow-y-auto p-4">
        {/* Shop Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-blue-900">{shop.name}</h3>
          {shop.owner_name && (
            <p className="text-sm text-blue-700">Owner: {shop.owner_name}</p>
          )}
        </div>

        {/* Delivery Boy Selection */}
        {deliveryBoys.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Boy
            </label>
            <select
              value={deliveryBoyId}
              onChange={(e) => setDeliveryBoyId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {deliveryBoys.map((boy) => (
                <option key={boy.id} value={boy.id}>
                  {boy.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Product List */}
        <div className="space-y-3">
          {products.map((product, index) => (
            <div
              key={product.milk_type_id}
              className={`bg-white border rounded-lg p-4 transition-all ${
                product.quantity > 0
                  ? 'border-blue-500 ring-2 ring-blue-100'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{product.name}</h4>
                  <p className="text-sm text-gray-600">₹{product.price.toFixed(2)} per packet</p>
                </div>
                {product.quantity > 0 && (
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">
                      ₹{(product.price * product.quantity).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateQuantity(index, -1)}
                  disabled={product.quantity === 0}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-5 h-5 text-gray-700" />
                </button>

                <input
                  type="number"
                  value={product.quantity}
                  onChange={(e) => setQuantityDirect(index, e.target.value)}
                  className="w-20 text-center text-lg font-semibold px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />

                <button
                  onClick={() => updateQuantity(index, 1)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>

                <div className="ml-auto text-sm text-gray-600">
                  {product.quantity > 0 && `${product.quantity} × ₹${product.price.toFixed(2)}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="border-t border-gray-200 bg-white p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">Total:</span>
          <span className="text-2xl font-bold text-blue-600">₹{total.toFixed(2)}</span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onBack}
            disabled={saving}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasItems || saving}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Delivery'}
          </button>
        </div>
      </div>
    </div>
  )
}

