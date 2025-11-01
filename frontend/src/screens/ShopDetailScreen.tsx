import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft, ArrowUp, ArrowDown, Plus, Minus, X, DollarSign, Settings, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../utils/formatCurrency'

interface ShopDetailScreenProps {
  shopId: string
  onBack: () => void
}

interface ChatMessage {
  id: string
  type: 'delivery' | 'payment' | 'pending'
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
  const [stockLevels, setStockLevels] = useState<{[key: string]: number}>({})
  const [showCustomRatesModal, setShowCustomRatesModal] = useState(false)
  const [customRates, setCustomRates] = useState<{[key: string]: number}>({})
  const [defaultRates, setDefaultRates] = useState<{[key: string]: number}>({})
  const [showPendingModal, setShowPendingModal] = useState(false)
  const [pendingAmount, setPendingAmount] = useState<number>(0)
  const [pendingNote, setPendingNote] = useState<string>('')
  const [paymentLoading, setPaymentLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Load all data when shop changes
  useEffect(() => {
    if (shopId) {
      loadAllData()
    }
  }, [shopId])

  const loadStockLevels = async () => {
    try {
      const { data, error } = await supabase
        .from('stock')
        .select('product_name, current_quantity')

      if (error) throw error

      const stockMap: {[key: string]: number} = {}
      data?.forEach(item => {
        stockMap[item.product_name] = item.current_quantity
      })
      
      setStockLevels(stockMap)
    } catch (error) {
      console.error('Error loading stock levels:', error)
    }
  }

  const loadCustomRates = async () => {
    try {
      // Load default rates
      const { data: defaultData, error: defaultError } = await supabase
        .from('milk_types')
        .select('id, name, price_per_packet')
      
      if (defaultError) throw defaultError
      
      const defaultMap: {[key: string]: number} = {}
      defaultData?.forEach((item: any) => {
        defaultMap[item.name] = item.price_per_packet
      })
      setDefaultRates(defaultMap)
      
      // Load custom rates for this shop
      const { data: customData, error: customError } = await supabase
        .from('shop_rates')
        .select(`
          custom_price_per_packet,
          milk_types!inner(name)
        `)
        .eq('shop_id', shopId)
      
      if (customError) throw customError
      
      const customMap: {[key: string]: number} = {}
      customData?.forEach((item: any) => {
        customMap[item.milk_types.name] = item.custom_price_per_packet
      })
      setCustomRates(customMap)
    } catch (error) {
      console.error('Error loading custom rates:', error)
    }
  }

  const saveCustomRates = async () => {
    try {
      // Delete existing custom rates for this shop
      await supabase
        .from('shop_rates')
        .delete()
        .eq('shop_id', shopId)
      
      // Insert new custom rates
      const ratesToInsert = Object.entries(customRates).map(([productName, price]) => {
        const product = milkProducts.find(p => p.name === productName)
        return {
          shop_id: shopId,
          milk_type_id: product?.id,
          custom_price_per_packet: price
        }
      }).filter(rate => rate.milk_type_id)
      
      if (ratesToInsert.length > 0) {
        const { error } = await supabase
          .from('shop_rates')
          .insert(ratesToInsert)
        
        if (error) throw error
      }
      
      setShowCustomRatesModal(false)
      alert('Custom rates saved successfully!')
    } catch (error) {
      console.error('Error saving custom rates:', error)
      alert('Failed to save custom rates. Please try again.')
    }
  }

  const handleAddPendingAmount = async () => {
    try {
      if (pendingAmount <= 0) {
        alert('Please enter a valid pending amount')
        return
      }

      const { data, error } = await supabase
        .from('shop_pending_history')
        .insert({
          shop_id: shopId,
          pending_amount: pendingAmount,
          note: pendingNote || 'Manual pending amount added',
          original_date: new Date().toISOString().split('T')[0]
        })
        .select()

      if (error) {
        console.error('Error adding pending amount:', error)
        throw error
      }

      // Create activity log entry for chat display
      const pendingHistoryId = data?.[0]?.id
      console.log('📝 CREATING ACTIVITY LOG:', {
        shopId,
        pendingAmount,
        pendingNote,
        pendingHistoryId
      })
      
      const { data: activityData, error: activityError } = await supabase.from('activity_log').insert({
        shop_id: shopId,
        activity_type: 'pending_added',
        message: `Manual pending added: ₹${pendingAmount}${pendingNote ? ' - ' + pendingNote : ''}`,
        amount: pendingAmount,
        delivery_date: new Date().toISOString().split('T')[0],
        metadata: { pending_history_id: pendingHistoryId }
      }).select()

      if (activityError) {
        console.error('❌ Error creating activity log:', activityError)
        // Don't throw, pending was already saved successfully
      } else {
        console.log('✅ Activity log created successfully:', activityData)
      }

      // Reset form
      setPendingAmount(0)
      setPendingNote('')
      setShowPendingModal(false)
      
      // Reload pending amounts and messages to update UI
      await Promise.all([
        loadPendingAmounts(),
        loadMessages()
      ])
      
      alert('Pending amount added successfully!')
    } catch (error) {
      console.error('❌ CRITICAL ERROR adding pending amount:', error)
      alert(`Failed to add pending amount: ${error.message}`)
    }
  }

  const loadAllData = async () => {
    try {
      setLoading(true)
      
      // Load all data in parallel for better performance
      await Promise.all([
        loadShopData(),
        loadMilkProducts(),
        loadMessages(),
        loadPendingAmounts(),
        loadStockLevels(),
        loadCustomRates()
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
      const [todayDeliveriesResult, todayPaymentsResult, allDeliveriesResult, allPaymentsResult, pendingHistoryResult] = await Promise.all([
        supabase
          .from('deliveries')
          .select('total_amount, payment_amount')
          .eq('shop_id', shopId)
          .eq('delivery_date', today)
          .eq('is_archived', false),  // CRITICAL: Only active deliveries for today
        supabase
          .from('payments')
          .select('amount')
          .eq('shop_id', shopId)
          .eq('payment_date', today),
        supabase
          .from('deliveries')
          .select('total_amount, payment_amount, delivery_date')
          .eq('shop_id', shopId)
          .eq('is_archived', false),  // CRITICAL: Exclude archived deliveries
        supabase
          .from('payments')
          .select('amount, payment_date')
          .eq('shop_id', shopId),
        supabase
          .from('shop_pending_history')
          .select('pending_amount, original_date')
          .eq('shop_id', shopId)
      ])

      if (todayDeliveriesResult.error) throw todayDeliveriesResult.error
      if (todayPaymentsResult.error) throw todayPaymentsResult.error
      if (allDeliveriesResult.error) throw allDeliveriesResult.error
      if (allPaymentsResult.error) throw allPaymentsResult.error
      if (pendingHistoryResult.error) throw pendingHistoryResult.error

      const todayDeliveries = todayDeliveriesResult.data || []
      const todayPayments = todayPaymentsResult.data || []
      const allDeliveries = allDeliveriesResult.data || []
      const allPayments = allPaymentsResult.data || []
      const pendingHistory = pendingHistoryResult.data || []

      // Calculate today's pending - use unpaid amount per delivery
      const todayPendingAmount = todayDeliveries?.reduce((sum, d) => {
        const totalAmount = Number(d.total_amount) || 0
        const paidAmount = Number(d.payment_amount) || 0
        const unpaid = totalAmount - paidAmount
        if (isNaN(unpaid) || unpaid < 0) {
          console.error('Invalid delivery amount calculation:', d)
          return sum
        }
        return sum + unpaid
      }, 0) || 0

      // Calculate previous pending (before today) - use unpaid amount per delivery
      const previousDeliveries = allDeliveries?.filter(d => {
        const deliveryDate = new Date(d.delivery_date).toISOString().split('T')[0]
        return deliveryDate < today
      }) || []
      
      const previousPendingAmount = previousDeliveries.reduce((sum, d) => {
        const totalAmount = Number(d.total_amount) || 0
        const paidAmount = Number(d.payment_amount) || 0
        const unpaid = totalAmount - paidAmount
        if (isNaN(unpaid) || unpaid < 0) {
          console.error('Invalid previous delivery amount calculation:', d)
          return sum
        }
        return sum + unpaid
      }, 0)

      // ALL manual pending goes to Previous Pending (as per business logic)
      const manualPendingAmount = pendingHistory.reduce((sum, p) => {
        const amount = Number(p.pending_amount) || 0
        if (isNaN(amount) || amount < 0) {
          console.error('Invalid manual pending amount:', p)
          return sum
        }
        return sum + amount
      }, 0)

      // Calculate final pending amounts
      // Today Pending = Only today's deliveries (unpaid amount)
      // Previous Pending = Old deliveries (unpaid amount) + ALL manual pending
      const adjustedTodayPending = todayPendingAmount
      const adjustedPreviousPending = previousPendingAmount + manualPendingAmount

      // Calculate total pending (delivery-based + manual pending)
      const totalPendingAmount = adjustedTodayPending + adjustedPreviousPending

      // Enhanced Debug logging for Smart Store investigation
      console.log('🔍 SMART STORE DEBUG - Pending Amounts:', {
        shopId,
        today,
        todayDeliveries: todayDeliveries.map(d => ({ total: d.total_amount, paid: d.payment_amount, unpaid: d.total_amount - d.payment_amount })),
        previousDeliveries: previousDeliveries.map(d => ({ total: d.total_amount, paid: d.payment_amount, unpaid: d.total_amount - d.payment_amount, date: d.delivery_date })),
        manualPendingHistory: pendingHistory.map(p => ({ amount: p.pending_amount, date: p.original_date })),
        todayPendingAmount,
        manualPendingAmount,
        adjustedTodayPending,
        previousPendingAmount,
        adjustedPreviousPending,
        totalPendingAmount,
        calculation: `${todayPendingAmount} (today delivery only) + ${previousPendingAmount} (old delivery unpaid) + ${manualPendingAmount} (all manual pending) = ${adjustedPreviousPending} (previous total) = ${totalPendingAmount} (grand total)`
      })
      
      console.log('🎯 FINAL STATE VALUES:', {
        adjustedTodayPending,
        adjustedPreviousPending,
        totalPendingAmount
      })

      setTodayPending(adjustedTodayPending)
      setPreviousPending(adjustedPreviousPending)
      setTotalPending(totalPendingAmount)
    } catch (error) {
      console.error('Error loading pending amounts:', error)
    }
  }

  const loadMessages = async () => {
    try {
      // Load ALL deliveries (including archived for history), payments, and activity logs in parallel
      const [deliveriesResult, paymentsResult, activityLogsResult] = await Promise.all([
        supabase
          .from('deliveries')
          .select('id, total_amount, products, created_at')
          .eq('shop_id', shopId)
          // REMOVED is_archived filter to show complete history
          .order('created_at', { ascending: false }),
        supabase
          .from('payments')
          .select('id, amount, created_at')
          .eq('shop_id', shopId)
          .order('created_at', { ascending: false }),
        supabase
          .from('activity_log')
          .select('id, message, amount, created_at, activity_type, metadata')
          .eq('shop_id', shopId)
          .in('activity_type', ['delivery_added', 'payment_collected', 'payment_partial', 'pending_added'])
          .order('created_at', { ascending: false })
      ])

      if (deliveriesResult.error) throw deliveriesResult.error
      if (paymentsResult.error) throw paymentsResult.error
      if (activityLogsResult.error) {
        console.warn('Activity logs query failed:', activityLogsResult.error)
      }

      const deliveries = deliveriesResult.data || []
      const payments = paymentsResult.data || []
      const activityLogs = activityLogsResult.data || []

      console.log('📨 LOADING MESSAGES DEBUG:', {
        deliveriesCount: deliveries.length,
        paymentsCount: payments.length,
        activityLogsCount: activityLogs.length,
        activityLogsData: activityLogs
      })

      // Convert to chat messages from actual deliveries/payments data
      const deliveryMessages: ChatMessage[] = (deliveries || []).map(delivery => ({
        id: `delivery-${delivery.id}`,
        type: 'delivery',
        content: formatDeliveryContent(delivery),
        amount: delivery.total_amount,
        timestamp: formatTimestamp(delivery.created_at),
        date: new Date(delivery.created_at).toLocaleDateString(),
        created_at: delivery.created_at
      }))

      const paymentMessages: ChatMessage[] = (payments || []).map(payment => ({
        id: `payment-${payment.id}`,
        type: 'payment',
        content: `${formatCurrency(payment.amount)} Paid`,
        amount: payment.amount,
        timestamp: formatTimestamp(payment.created_at),
        date: new Date(payment.created_at).toLocaleDateString(),
        created_at: payment.created_at
      }))

      // Convert activity logs to messages (for manual pending and any missing entries)
      const activityMessages: ChatMessage[] = (activityLogs || []).map(activity => ({
        id: `activity-${activity.id}`,
        type: activity.activity_type === 'pending_added' ? 'pending' : activity.activity_type === 'delivery_added' ? 'delivery' : 'payment',
        content: activity.message,
        amount: activity.amount,
        timestamp: formatTimestamp(activity.created_at),
        date: new Date(activity.created_at).toLocaleDateString(),
        created_at: activity.created_at
      }))

      // Combine and sort by created_at timestamp (oldest first for WhatsApp style)
      const allMessages = [...deliveryMessages, ...paymentMessages, ...activityMessages]
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

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear().toString().slice(-2) // Last 2 digits of year
    const time = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
    return `${day}/${month}/${year} ${time}`
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

  const deleteDelivery = async (deliveryId: string) => {
    if (!confirm('Delete this delivery? This will restore stock and move it to history.')) return
    try {
      // 1) Fetch delivery details
      const { data: delivery, error: fetchErr } = await supabase
        .from('deliveries')
        .select('id, shop_id, products, total_amount')
        .eq('id', deliveryId)
        .single()
      if (fetchErr) throw fetchErr

      // 2) Insert audit log
      const { error: logErr } = await supabase
        .from('deleted_deliveries')
        .insert({
          delivery_id: delivery.id,
          shop_id: delivery.shop_id,
          products: delivery.products,
          total_amount: delivery.total_amount,
          deleted_by: 'owner'
        })
      if (logErr) throw logErr

      // 3) Restore stock
      const items = Array.isArray(delivery.products) ? delivery.products : []
      for (const item of items) {
        const productName = item?.name
        const qty = Number(item?.quantity) || 0
        if (!productName || qty <= 0) continue

        const { data: stockData, error: stockFetchErr } = await supabase
          .from('stock')
          .select('current_quantity')
          .eq('product_name', productName)
        
        if (stockFetchErr) {
          console.error('Error fetching stock for', productName, ':', stockFetchErr)
          continue
        }
        
        if (!stockData || stockData.length === 0) {
          // If stock entry missing, create it
          const { error: insertStockErr } = await supabase
            .from('stock')
            .insert({ product_name: productName, current_quantity: qty })
          if (insertStockErr) console.error('Error creating stock for', productName, insertStockErr)
        } else {
          const currentQty = stockData[0]?.current_quantity || 0
          const newQty = currentQty + qty
          const { error: updErr } = await supabase
            .from('stock')
            .update({ current_quantity: newQty })
            .eq('product_name', productName)
          if (updErr) console.error('Error restoring stock for', productName, updErr)
        }
      }

      // 4) Archive delivery
      const { error: archErr } = await supabase
        .from('deliveries')
        .update({ is_archived: true })
        .eq('id', deliveryId)
      if (archErr) throw archErr

      // 5) Reload
      await Promise.all([loadMessages(), loadPendingAmounts(), loadStockLevels()])
    } catch (e) {
      console.error('Delete delivery failed:', e)
      alert('Failed to delete delivery. Please try again.')
    }
  }

  const checkStockAvailability = async () => {
    const insufficientStock = []
    
    for (const [productId, quantity] of Object.entries(selectedProducts)) {
      if (quantity > 0) {
        const product = milkProducts.find(p => p.id === productId)
        if (product) {
          try {
            const { data: stockData, error } = await supabase
              .from('stock')
              .select('current_quantity')
              .eq('product_name', product.name)

            if (error) {
              console.error('Error checking stock for', product.name, ':', error)
              insufficientStock.push({ product: product.name, available: 0, requested: quantity })
            } else if (!stockData || stockData.length === 0) {
              // Product not found in stock table - assume no stock
              console.warn('Product not found in stock:', product.name)
              insufficientStock.push({ product: product.name, available: 0, requested: quantity })
            } else {
              const available = stockData[0]?.current_quantity || 0
              if (available < quantity) {
                insufficientStock.push({ product: product.name, available, requested: quantity })
              }
            }
          } catch (error) {
            console.error('Error checking stock for', product.name, ':', error)
            insufficientStock.push({ product: product.name, available: 0, requested: quantity })
          }
        }
      }
    }
    
    return insufficientStock
  }

  const handleSaveMilk = async () => {
    try {
      // Check stock availability first
      const insufficientStock = await checkStockAvailability()
      
      if (insufficientStock.length > 0) {
        const stockMessage = insufficientStock.map(item => 
          `${item.product}: Available ${item.available}, Requested ${item.requested}`
        ).join('\n')
        
        alert(`Insufficient stock for delivery:\n\n${stockMessage}\n\nPlease reduce quantities or add stock in Settings.`)
        return
      }

      // Calculate total using custom rates if available
      const totalAmount = Object.entries(selectedProducts).reduce((sum, [productId, quantity]) => {
        const product = milkProducts.find(p => p.id === productId)
        if (!product) return sum
        
        // Use custom rate if available, otherwise use default rate
        const customRate = customRates[product.name]
        const rate = customRate !== undefined ? customRate : product.price_per_packet
        
        return sum + (rate * quantity)
      }, 0)

      const products = Object.entries(selectedProducts)
        .filter(([_, quantity]) => quantity > 0)
        .map(([productId, quantity]) => {
          const product = milkProducts.find(p => p.id === productId)
          
          // Use custom rate if available, otherwise use default rate
          const customRate = customRates[product.name]
          const rate = customRate !== undefined ? customRate : product.price_per_packet
          
          return {
            id: productId,
            name: product?.name || '',
            price_per_packet: rate, // Use custom rate if set
            quantity
          }
        })

      console.log('🥛 MILK DELIVERY DEBUG - Before saving:', {
        shopId,
        selectedProducts,
        products,
        totalAmount,
        deliveryDate: new Date().toISOString().split('T')[0],
        currentPending: { todayPending, previousPending, totalPending }
      })

      const { data: deliveryData, error } = await supabase
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
        .select()
        .single()

      if (error) throw error

      console.log('✅ MILK DELIVERY SAVED - Amount:', totalAmount, 'ID:', deliveryData?.id)

      // Create activity log entry for chat history
      if (deliveryData?.id) {
        const { error: activityError } = await supabase.from('activity_log').insert({
          shop_id: shopId,
          delivery_boy_id: '270cf1bb-44ff-4d62-b98f-24cb2aedcbcb',
          activity_type: 'delivery_added',
          message: `Delivery added to ${shop?.name || 'shop'}: ${formatCurrency(totalAmount)}`,
          amount: totalAmount,
          delivery_date: new Date().toISOString().split('T')[0],
          metadata: { delivery_id: deliveryData.id }
        })

        if (activityError) {
          console.error('❌ Error creating activity log:', activityError)
        } else {
          console.log('✅ Activity log created for delivery')
        }
      }

      // Reduce stock for delivered products
      for (const [productId, quantity] of Object.entries(selectedProducts)) {
        if (quantity > 0) {
          const product = milkProducts.find(p => p.id === productId)
          if (product) {
            try {
              // Get current stock
              const { data: stockData, error: stockError } = await supabase
                .from('stock')
                .select('current_quantity')
                .eq('product_name', product.name)

              if (stockError) {
                console.error('Error fetching stock for', product.name, ':', stockError)
                continue
              }

              if (!stockData || stockData.length === 0) {
                console.warn('Product not found in stock for reduction:', product.name)
                continue
              }

              const currentQuantity = stockData[0]?.current_quantity || 0
              const newQuantity = Math.max(0, currentQuantity - quantity)
              
              // Update stock
              const { error: updateError } = await supabase
                .from('stock')
                .update({ current_quantity: newQuantity })
                .eq('product_name', product.name)

              if (updateError) {
                console.error('Error updating stock for', product.name, ':', updateError)
              } else {
                console.log(`📦 STOCK REDUCED - ${product.name}: ${quantity} units (${currentQuantity} → ${newQuantity})`)
              }
            } catch (stockError) {
              console.error('Error reducing stock for', product.name, ':', stockError)
            }
          }
        }
      }

      // Reset form
      setSelectedProducts({})
      setShowMilkModal(false)
      
      // Reload all data to refresh the UI
      await loadAllData()
      
      console.log('🔄 DATA RELOADED - New pending amounts will be calculated')
    } catch (error) {
      console.error('❌ Error saving delivery:', error)
    }
  }

  const handleSavePayment = async () => {
    // Prevent multiple rapid clicks
    if (paymentLoading) {
      console.log('⚠️ Payment already processing, ignoring click')
      return
    }

    try {
      setPaymentLoading(true)
      
      console.log('💰 PAYMENT DEBUG - Before saving:', {
        shopId,
        paymentAmount,
        paymentDate: new Date().toISOString().split('T')[0],
        currentPending: { todayPending, previousPending, totalPending }
      })

      // Use process_payment RPC function to handle FIFO logic and manual pending amounts
      const { data, error } = await supabase.rpc('process_payment', {
        p_shop_id: shopId,
        p_amount: paymentAmount,
        p_collected_by: 'delivery_boy',
        p_payment_date: new Date().toISOString().split('T')[0],
        p_notes: `Payment from ${shop?.name}`
      })

      if (error) throw error

      console.log('✅ PAYMENT PROCESSED - Result:', data)

      // Reset form
      setPaymentAmount(0)
      setShowPaymentModal(false)
      
      // Reload all data to refresh the UI
      await loadAllData()
      
      console.log('🔄 DATA RELOADED - New pending amounts will be calculated')
    } catch (error) {
      console.error('❌ Error saving payment:', error)
      alert('Failed to process payment. Please try again.')
    } finally {
      setPaymentLoading(false)
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
      if (!product) return sum
      
      // Use custom rate if available, otherwise use default rate
      const customRate = customRates[product.name]
      const rate = customRate !== undefined ? customRate : product.price_per_packet
      
      return sum + (rate * quantity)
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
      <div className="flex-1 overflow-y-auto p-4 pb-40 space-y-4">
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
                : message.type === 'pending'
                ? 'bg-amber-100 text-amber-900'
                : 'bg-green-100 text-green-900'
            }`}>
              <div className="flex items-center space-x-2 mb-1">
                {message.type === 'delivery' ? (
                  <ArrowUp className="w-4 h-4" />
                ) : message.type === 'pending' ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <ArrowDown className="w-4 h-4" />
                )}
                <span className="text-xs font-medium">{message.timestamp}</span>
                {message.type === 'delivery' && (
                  <button
                    onClick={() => deleteDelivery(message.id.replace('delivery-', ''))}
                    className="ml-auto text-xs text-red-600 hover:text-red-800"
                    title="Delete delivery"
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="whitespace-pre-line text-sm">
                {message.content}
              </div>
            </div>
          </div>
        ))}

        <div ref={chatEndRef} />
      </div>

      {/* Bottom Action Buttons - Mobile Optimized */}
      <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 shadow-lg">
        <div className="flex space-x-3">
          <button
            onClick={handleReceivePayment}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-xl font-semibold text-base flex items-center justify-center space-x-2 transition-colors touch-manipulation"
          >
            <ArrowDown className="w-6 h-6" />
            <span>Receive</span>
          </button>
          <button
            onClick={handleAddMilk}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl font-semibold text-base flex items-center justify-center space-x-2 transition-colors touch-manipulation"
          >
            <ArrowUp className="w-6 h-6" />
            <span>Add Milk</span>
          </button>
        </div>
      </div>

      {/* Add Milk Modal - Mobile Optimized */}
      {showMilkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-lg w-full h-[85vh] sm:h-auto sm:max-h-[90vh] sm:max-w-md flex flex-col">
            {/* Header - Mobile Optimized */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl sm:rounded-t-lg">
              <h3 className="text-xl font-bold text-gray-900">Add Milk Delivery</h3>
              <button
                onClick={() => setShowMilkModal(false)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Scrollable Content - Mobile Optimized */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-3">
                {milkProducts.map(product => (
                  <div key={product.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-base truncate">{product.name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatCurrency(customRates[product.name] !== undefined ? customRates[product.name] : product.price_per_packet)} each
                          {customRates[product.name] !== undefined && (
                            <span className="text-xs text-blue-600 ml-1">(Custom)</span>
                          )}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">Stock:</span>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            (stockLevels[product.name] || 0) <= 5 
                              ? 'bg-red-100 text-red-700' 
                              : (stockLevels[product.name] || 0) <= 10
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {stockLevels[product.name] || 0} units
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Mobile-Optimized Quantity Controls */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => updateQuantity(product.id, (selectedProducts[product.id] || 0) - 1)}
                        disabled={(selectedProducts[product.id] || 0) <= 0}
                        className="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:opacity-50 flex items-center justify-center transition-colors touch-manipulation"
                      >
                        <Minus className="w-5 h-5 text-gray-700" />
                      </button>
                      
                      <div className="flex-1 mx-4">
                        <input
                          type="number"
                          min="0"
                          value={selectedProducts[product.id] || 0}
                          onChange={(e) => updateQuantity(product.id, Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full text-center text-lg font-bold border-2 border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
                          placeholder="0"
                        />
                      </div>
                      
                      <button
                        onClick={() => updateQuantity(product.id, (selectedProducts[product.id] || 0) + 1)}
                        className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors touch-manipulation"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {/* Show total for this product if quantity > 0 */}
                    {(selectedProducts[product.id] || 0) > 0 && (
                      <div className="mt-3 text-center">
                        <span className="text-sm text-gray-600">
                          Total: {formatCurrency((selectedProducts[product.id] || 0) * (customRates[product.name] !== undefined ? customRates[product.name] : product.price_per_packet))}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Fixed Bottom Section - Mobile Optimized */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 sm:p-6">
              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900 text-lg">Total:</span>
                  <span className="text-2xl font-bold text-blue-600">{formatCurrency(getTotalAmount())}</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowMilkModal(false)}
                  className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold text-base transition-colors touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMilk}
                  disabled={getTotalAmount() === 0}
                  className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold text-base transition-colors touch-manipulation"
                >
                  Save Delivery
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal - Mobile Optimized */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-lg w-full h-[85vh] sm:h-auto sm:max-h-[90vh] sm:max-w-md flex flex-col">
            {/* Header - Mobile Optimized */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl sm:rounded-t-lg">
              <h3 className="text-xl font-bold text-gray-900">Receive Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Scrollable Content - Mobile Optimized */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* Pending Amounts Summary - Mobile Optimized */}
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Payment Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Today's Pending:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(todayPending)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Previous Pending:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(previousPending)}</span>
                  </div>
                  <div className="border-t border-blue-200 pt-3 flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total Pending:</span>
                    <span className="font-bold text-xl text-blue-600">{formatCurrency(totalPending)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Amount Received
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-4 py-4 text-lg font-semibold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
                    placeholder="Enter amount"
                  />
                </div>
                
                {/* Quick Payment Buttons - Mobile Optimized */}
                <div className="space-y-3">
                  {/* Collect Today Button */}
                  {todayPending > 0 && (
                    <button
                      onClick={() => setPaymentAmount(todayPending)}
                      disabled={paymentLoading}
                      className="w-full py-4 px-6 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 font-semibold text-base transition-colors touch-manipulation border-2 border-green-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      Collect Today ({formatCurrency(todayPending)})
                    </button>
                  )}
                  
                  {/* Full Amount Button */}
                  <button
                    onClick={() => setPaymentAmount(totalPending)}
                    disabled={paymentLoading}
                    className="w-full py-4 px-6 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 font-semibold text-base transition-colors touch-manipulation border-2 border-blue-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    Full Amount ({formatCurrency(totalPending)})
                  </button>
                </div>
              </div>
            </div>

            {/* Fixed Bottom Section - Mobile Optimized */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 sm:p-6">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold text-base transition-colors touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePayment}
                  disabled={paymentAmount <= 0 || paymentLoading}
                  className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold text-base transition-colors touch-manipulation"
                >
                  {paymentLoading ? 'Processing...' : 'Save Payment'}
                </button>
              </div>
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

            <div className="flex space-x-3 mb-4">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setShowCustomRatesModal(true)
                }}
                className="flex-1 py-2 px-4 border border-green-300 rounded-lg text-green-700 hover:bg-green-50"
              >
                Custom Rates
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setShowPendingModal(true)
                }}
                className="flex-1 py-2 px-4 border border-orange-300 rounded-lg text-orange-700 hover:bg-orange-50"
              >
                Add Pending
              </button>
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

      {/* Custom Rates Modal */}
      {showCustomRatesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Custom Rates for {shop?.name}</h3>
                <button
                  onClick={() => setShowCustomRatesModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {milkProducts.map(product => (
                  <div key={product.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        Default: {formatCurrency(product.price_per_packet)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        value={customRates[product.name] !== undefined ? customRates[product.name] : product.price_per_packet}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          setCustomRates(prev => ({
                            ...prev,
                            [product.name]: value
                          }))
                        }}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowCustomRatesModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCustomRates}
                  className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Save Custom Rates
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Pending Amount Modal */}
      {showPendingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Add Pending Amount</h3>
                <button
                  onClick={() => setShowPendingModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pending Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={pendingAmount}
                    onChange={(e) => setPendingAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter pending amount"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note (Optional)
                  </label>
                  <textarea
                    value={pendingNote}
                    onChange={(e) => setPendingNote(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Add a note about this pending amount"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowPendingModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPendingAmount}
                  disabled={pendingAmount <= 0}
                  className="flex-1 py-2 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add Pending
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}