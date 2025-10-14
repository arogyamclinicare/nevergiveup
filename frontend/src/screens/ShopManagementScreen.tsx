import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Edit, Trash2, Save, X, ArrowLeft } from 'lucide-react'

interface Shop {
  id: string
  name: string
  address: string
  phone: string
  owner_name: string
  route_number: string
  is_active: boolean
}

interface ShopManagementScreenProps {
  onBack?: () => void
}

export default function ShopManagementScreen({ onBack }: ShopManagementScreenProps) {
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingShop, setEditingShop] = useState<Shop | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    owner_name: '',
    route_number: ''
  })

  const fetchShops = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order('route_number', { ascending: true })

      if (error) throw error
      setShops(data || [])
    } catch (error) {
      console.error('Error fetching shops:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShops()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingShop) {
        // Update existing shop
        const { error } = await supabase
          .from('shops')
          .update(formData)
          .eq('id', editingShop.id)

        if (error) throw error
      } else {
        // Add new shop
        const { error } = await supabase
          .from('shops')
          .insert([formData])

        if (error) throw error
      }

      setShowAddForm(false)
      setEditingShop(null)
      setFormData({ name: '', address: '', phone: '', owner_name: '', route_number: '' })
      fetchShops()
    } catch (error) {
      console.error('Error saving shop:', error)
    }
  }

  const handleEdit = (shop: Shop) => {
    setEditingShop(shop)
    setFormData({
      name: shop.name,
      address: shop.address || '',
      phone: shop.phone || '',
      owner_name: shop.owner_name || '',
      route_number: shop.route_number || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (shopId: string) => {
    if (!confirm('Are you sure you want to delete this shop?')) return

    try {
      const { error } = await supabase
        .from('shops')
        .update({ is_active: false })
        .eq('id', shopId)

      if (error) throw error
      fetchShops()
    } catch (error) {
      console.error('Error deleting shop:', error)
    }
  }

  const resetForm = () => {
    setShowAddForm(false)
    setEditingShop(null)
    setFormData({ name: '', address: '', phone: '', owner_name: '', route_number: '' })
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}
          <h2 className="text-2xl font-bold text-gray-900">Shop Management</h2>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Shop</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {editingShop ? 'Edit Shop' : 'Add New Shop'}
            </h3>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shop Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Owner Name
                </label>
                <input
                  type="text"
                  value={formData.owner_name}
                  onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Route Number
                </label>
                <input
                  type="text"
                  value={formData.route_number}
                  onChange={(e) => setFormData({ ...formData, route_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Route 1, Route 2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <Save className="w-4 h-4" />
                <span>{editingShop ? 'Update Shop' : 'Add Shop'}</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Shops List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Shops</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading shops...</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {shops.map((shop) => (
              <div key={shop.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-semibold text-gray-900">{shop.name}</h4>
                      {shop.route_number && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {shop.route_number}
                        </span>
                      )}
                    </div>
                    {shop.owner_name && (
                      <p className="text-sm text-gray-600">Owner: {shop.owner_name}</p>
                    )}
                    {shop.phone && (
                      <p className="text-sm text-gray-600">Phone: {shop.phone}</p>
                    )}
                    {shop.address && (
                      <p className="text-sm text-gray-500 mt-1">{shop.address}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(shop)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(shop.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
