import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft, ArrowUp, ArrowDown, Plus, Minus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../utils/formatCurrency'

interface ShopDetailScreenProps {
  shopId: string
  onBack: () => void
}

interface ChatMessage {
  id: string
  type: 'delivery' | 'payment'
  content: string
  amount: number
  timestamp: string
  date: string
  created_at: string
}

interface MilkProduct {
  id: string
  name: string
  price_per_packet: number
}

export default function ShopDetailScreen({ shopId, onBack }: ShopDetailScreenProps) {
  const [shop, setShop] = useState<any>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [milkProducts, setMilkProducts] = useState<MilkProduct[]>([])
  const [selectedProducts, setSelectedProducts] = useState<{[key: string]: number}>({})
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [showMilkModal, setShowMilkModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [todayPending, setTodayPending] = useState<number>(0)
  const [previousPending, setPreviousPending] = useState<number>(0)
  const [totalPending, setTotalPending] = useState<number>(0)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    address: '',
    phone: '',
    owner_name: '',
    route_number: ''
  })
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Load all data when shop changes
  useEffect(() => {
    if (shopId) {
      loadAllData()
    }
  }, [shopId])

  const loadAllData = async () => {
    try {
      setLoading(true)
      
      // Load all data in parallel for better performance
      await Promise.all([
        loadShopData(),
        loadMilkProducts(),
        loadMessages(),
        loadPendingAmounts()
      ])
    } catch (error) {
      console.error('Error loading shop data:', error)
      // Retry once after a short delay
      setTimeout(async () => {
        try {
          await Promise.all([
            loadShopData(),
            loadMilkProducts(),
            loadMessages(),
            loadPendingAmounts()
          ])
        } catch (retryError) {
          console.error('Retry failed:', retryError)
        }
      }, 1000)
    } finally {
      setLoading(false)
    }
  }

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadShopData = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('id, name, address, phone, owner_name, route_number')
        .eq('id', shopId)
        .single()

      if (error) throw error
      setShop(data)
    } catch (error) {
      console.error('Error loading shop:', error)
    }
  }

  const loadMilkProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('milk_types')
        .select('*')
        .order('name')

      if (error) throw error
      setMilkProducts(data || [])
    } catch (error) {
      console.error('Error loading milk products:', error)
    }
  }

  const loadPendingAmounts = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Load all data in parallel for better performance
      const [todayDeliveriesResult, todayPaymentsResult, allDeliveriesResult, allPaymentsResult] = await Promise.all([
        supabase
          .from('deliveries')
          .select('total_amount, payment_amount')
          .eq('shop_id', shopId)
          .eq('delivery_date', today),
        supabase
          .from('payments')
          .select('amount')
          .eq('shop_id', shopId)
          .eq('payment_date', today),
        supabase
          .from('deliveries')
          .select('total_amount, payment_amount, delivery_date')
          .eq('shop_id', shopId),
        supabase
          .from('payments')
          .select('amount, payment_date')
          .eq('shop_id', shopId)
      ])

      if (todayDeliveriesResult.error) throw todayDeliveriesResult.error
      if (todayPaymentsResult.error) throw todayPaymentsResult.error
      if (allDeliveriesResult.error) throw allDeliveriesResult.error
      if (allPaymentsResult.error) throw allPaymentsResult.error

      const todayDeliveries = todayDeliveriesResult.data || []
      const todayPayments = todayPaymentsResult.data || []
      const allDeliveries = allDeliveriesResult.data || []
      const allPayments = allPaymentsResult.data || []

      // Calculate today's pending
      const todayTotal = todayDeliveries?.reduce((sum, d) => sum + Number(d.total_amount), 0) || 0
      const todayPaid = todayPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
      const todayPendingAmount = Math.max(0, todayTotal - todayPaid)

      // Calculate previous pending (before today)
      const previousDeliveries = allDeliveries?.filter(d => d.delivery_date < today) || []
      const previousPayments = allPayments?.filter(p => p.payment_date < today) || []
      
      const previousTotal = previousDeliveries.reduce((sum, d) => sum + Number(d.total_amount), 0)
      const previousPaid = previousPayments.reduce((sum, p) => sum + Number(p.amount), 0)
      const previousPendingAmount = Math.max(0, previousTotal - previousPaid)

      // Calculate total pending
      const totalPendingAmount = todayPendingAmount + previousPendingAmount

      // Debug logging
      console.log('Pending Amounts Debug:', {
        today,
        todayDeliveries,
        todayPayments,
        todayTotal,
        todayPaid,
        todayPendingAmount,
        previousDeliveries,
        previousPayments,
        previousTotal,
        previousPaid,
        previousPendingAmount,
        totalPendingAmount
      })

      setTodayPending(todayPendingAmount)
      setPreviousPending(previousPendingAmount)
      setTotalPending(totalPendingAmount)
    } catch (error) {
      console.error('Error loading pending amounts:', error)
    }
  }

  const loadMessages = async () => {
    try {
      // Load deliveries and payments in parallel
      const [deliveriesResult, paymentsResult] = await Promise.all([
        supabase
          .from('deliveries')
          .select('id, total_amount, products, created_at')
          .eq('shop_id', shopId)
          .order('created_at', { ascending: false }),
        supabase
          .from('payments')
          .select('id, amount, created_at')
          .eq('shop_id', shopId)
          .order('created_at', { ascending: false })
      ])

      if (deliveriesResult.error) throw deliveriesResult.error
      if (paymentsResult.error) throw paymentsResult.error

      const deliveries = deliveriesResult.data || []
      const payments = paymentsResult.data || []

      // Convert to chat messages
      const deliveryMessages: ChatMessage[] = (deliveries || []).map(delivery => ({
        id: `delivery-${delivery.id}`,
        type: 'delivery',
        content: formatDeliveryContent(delivery),
        amount: delivery.total_amount,
        timestamp: new Date(delivery.created_at).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }),
        date: new Date(delivery.created_at).toLocaleDateString(),
        created_at: delivery.created_at
      }))

      const paymentMessages: ChatMessage[] = (payments || []).map(payment => ({
        id: `payment-${payment.id}`,
        type: 'payment',
        content: `${formatCurrency(payment.amount)} Paid`,
        amount: payment.amount,
        timestamp: new Date(payment.created_at).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }),
        date: new Date(payment.created_at).toLocaleDateString(),
        created_at: payment.created_at
      }))

      // Combine and sort by created_at timestamp (oldest first for WhatsApp style)
      const allMessages = [...deliveryMessages, ...paymentMessages]
        .sort((a, b) => {
          // Sort by created_at timestamp, oldest first (ascending)
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })

      setMessages(allMessages)
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDeliveryContent = (delivery: any) => {
    const products = delivery.products || []
    const productLines = products.map((p: any) => 
      `${p.name} x${p.quantity} = ${formatCurrency(p.price_per_packet * p.quantity)}`
    ).join('\n')
    
    const total = delivery.total_amount
    return `${productLines}\nTotal: ${formatCurrency(total)}`
  }

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleAddMilk = () => {
    setShowMilkModal(true)
  }

  const handleReceivePayment = () => {
    setShowPaymentModal(true)
  }

  const handleSaveMilk = async () => {
    try {
      const totalAmount = Object.entries(selectedProducts).reduce((sum, [productId, quantity]) => {
        const product = milkProducts.find(p => p.id === productId)
        return sum + (product ? product.price_per_packet * quantity : 0)
      }, 0)

      const products = Object.entries(selectedProducts)
        .filter(([_, quantity]) => quantity > 0)
        .map(([productId, quantity]) => {
          const product = milkProducts.find(p => p.id === productId)
          return {
            id: productId,
            name: product?.name || '',
            price_per_packet: product?.price_per_packet || 0,
            quantity
          }
        })

      const { error } = await supabase
        .from('deliveries')
        .insert({
          shop_id: shopId,
          delivery_boy_id: '270cf1bb-44ff-4d62-b98f-24cb2aedcbcb',
          delivery_date: new Date().toISOString().split('T')[0],
          products: products,
          total_amount: totalAmount,
          payment_status: 'pending',
          payment_amount: 0,
          delivery_status: 'delivered',
          notes: `Milk delivered to ${shop?.name}`,
          delivered_at: new Date().toISOString()
        })

      if (error) throw error

      // Reset form
      setSelectedProducts({})
      setShowMilkModal(false)
      
      // Reload all data to refresh the UI
      await loadAllData()
    } catch (error) {
      console.error('Error saving delivery:', error)
    }
  }

  const handleSavePayment = async () => {
    try {
      const { error } = await supabase
        .from('payments')
        .insert({
          shop_id: shopId,
          delivery_boy_id: '270cf1bb-44ff-4d62-b98f-24cb2aedcbcb',
          amount: paymentAmount,
          payment_date: new Date().toISOString().split('T')[0],
          payment_type: 'cash',
          notes: `Payment from ${shop?.name}`
        })

      if (error) throw error

      // Reset form
      setPaymentAmount(0)
      setShowPaymentModal(false)
      
      // Reload all data to refresh the UI
      await loadAllData()
    } catch (error) {
      console.error('Error saving payment:', error)
    }
  }

  const updateQuantity = (productId: string, quantity: number) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: Math.max(0, quantity)
    }))
  }

  const getTotalAmount = () => {
    return Object.entries(selectedProducts).reduce((sum, [productId, quantity]) => {
      const product = milkProducts.find(p => p.id === productId)
      return sum + (product ? product.price_per_packet * quantity : 0)
    }, 0)
  }

  const handleSaveShop = async () => {
    try {
      const { error } = await supabase
        .from('shops')
        .update({
          name: editForm.name,
          address: editForm.address,
          phone: editForm.phone,
          owner_name: editForm.owner_name,
          route_number: editForm.route_number
        })
        .eq('id', shopId)

      if (error) throw error

      // Reload shop data
      await loadShopData()
      setShowEditModal(false)
    } catch (error) {
      console.error('Error updating shop:', error)
    }
  }

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">
        <button
          onClick={onBack}
          className="mr-3 p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-gray-900">{shop?.name}</h1>
          <p className="text-sm text-gray-500">View Profile</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => {
              setEditForm({
                name: shop?.name || '',
                address: shop?.address || '',
                phone: shop?.phone || '',
                owner_name: shop?.owner_name || '',
                route_number: shop?.route_number || ''
              })
              setShowEditModal(true)
            }}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
        {/* Today Separator */}
        <div className="flex justify-center">
          <div className="bg-teal-500 text-white px-4 py-1 rounded-full text-sm font-medium">
            Today
          </div>
        </div>

        {/* Messages */}
        {messages.map((message, index) => (
          <div key={message.id} className={`flex ${message.type === 'delivery' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              message.type === 'delivery' 
                ? 'bg-blue-100 text-blue-900' 
                : 'bg-green-100 text-green-900'
            }`}>
              <div className="flex items-center space-x-2 mb-1">
                {message.type === 'delivery' ? (
                  <ArrowUp className="w-4 h-4" />
                ) : (
                  <ArrowDown className="w-4 h-4" />
                )}
                <span className="text-xs font-medium">{message.timestamp}</span>
              </div>
              <div className="whitespace-pre-line text-sm">
                {message.content}
              </div>
            </div>
          </div>
        ))}

        <div ref={chatEndRef} />
      </div>

      {/* Bottom Action Buttons - Fixed above navigation */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
        <div className="flex space-x-3">
          <button
            onClick={handleReceivePayment}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2"
          >
            <ArrowDown className="w-5 h-5" />
            <span>Receive</span>
          </button>
          <button
            onClick={handleAddMilk}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2"
          >
            <ArrowUp className="w-5 h-5" />
            <span>Add Milk</span>
          </button>
        </div>
      </div>

      {/* Add Milk Modal */}
      {showMilkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Milk Delivery</h3>
            
            <div className="space-y-4">
              {milkProducts.map(product => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">{formatCurrency(product.price_per_packet)} each</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(product.id, (selectedProducts[product.id] || 0) - 1)}
                      className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={selectedProducts[product.id] || 0}
                      onChange={(e) => updateQuantity(product.id, Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-12 text-center font-medium border border-gray-300 rounded px-1 py-1"
                    />
                    <button
                      onClick={() => updateQuantity(product.id, (selectedProducts[product.id] || 0) + 1)}
                      className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total:</span>
                <span className="text-lg font-bold">{formatCurrency(getTotalAmount())}</span>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowMilkModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMilk}
                disabled={getTotalAmount() === 0}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Receive Payment</h3>
            
            {/* Pending Amounts Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Today's Pending:</span>
                  <span className="font-medium">{formatCurrency(todayPending)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Previous Pending:</span>
                  <span className="font-medium">{formatCurrency(previousPending)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-sm font-semibold text-gray-800">Total Pending:</span>
                  <span className="font-bold text-lg">{formatCurrency(totalPending)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount Received
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter amount"
                />
              </div>
              
              {/* Full Amount Button */}
              <button
                onClick={() => setPaymentAmount(totalPending)}
                className="w-full py-2 px-4 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium"
              >
                Full Amount ({formatCurrency(totalPending)})
              </button>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePayment}
                disabled={paymentAmount <= 0}
                className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Shop Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Shop Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shop Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter shop name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Name
                </label>
                <input
                  type="text"
                  value={editForm.owner_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, owner_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter owner name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={editForm.address}
                  onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter shop address"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Route Number
                </label>
                <input
                  type="text"
                  value={editForm.route_number}
                  onChange={(e) => setEditForm(prev => ({ ...prev, route_number: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter route number"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveShop}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}