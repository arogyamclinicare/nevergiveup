import { useState } from 'react'
import { supabase, CollectionViewRow } from '../lib/supabase'
import { X, CreditCard, AlertCircle, Clock } from 'lucide-react'

interface PaymentModalProps {
  shop: CollectionViewRow
  onClose: () => void
  onSuccess: () => void
}

export default function PaymentModal({ shop, onClose, onSuccess }: PaymentModalProps) {
  const [paymentAmount, setPaymentAmount] = useState<string>('')
  const [paymentType, setPaymentType] = useState<'today' | 'old' | 'total' | 'custom'>('custom')
  const [notes, setNotes] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const todayAmount = Number(shop.today_pending)
  const oldAmount = Number(shop.old_pending)
  const totalAmount = Number(shop.total_pending)

  const handlePaymentTypeChange = (type: 'today' | 'old' | 'total' | 'custom') => {
    setPaymentType(type)
    setError(null)
    
    switch (type) {
      case 'today':
        setPaymentAmount(todayAmount.toString())
        break
      case 'old':
        setPaymentAmount(oldAmount.toString())
        break
      case 'total':
        setPaymentAmount(totalAmount.toString())
        break
      case 'custom':
        setPaymentAmount('')
        break
    }
  }

  const handlePayment = async () => {
    const amount = parseFloat(paymentAmount)
    
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (amount > totalAmount) {
      setError(`Amount cannot exceed total pending (₹${totalAmount.toFixed(2)})`)
      return
    }

    try {
      setProcessing(true)
      setError(null)

      // Call the process_payment PostgreSQL function
      const { data, error } = await supabase.rpc('process_payment', {
        p_shop_id: shop.shop_id,
        p_amount: amount,
        p_collected_by: 'Collection Staff', // TODO: Get from user context
        p_payment_date: new Date().toISOString().split('T')[0],
        p_notes: notes || null
      })

      if (error) throw error

      if (data && data.success) {
        onSuccess()
      } else {
        throw new Error(data?.error || 'Failed to process payment')
      }
    } catch (err: any) {
      console.error('Error processing payment:', err)
      setError(err.message || 'Failed to process payment')
    } finally {
      setProcessing(false)
    }
  }

  const handlePayTomorrow = async () => {
    try {
      setProcessing(true)
      setError(null)
      setMessage(null)

      // Move today's delivery to pending history (if not already deferred)
      if (shop.status !== 'pay_tomorrow') {
        const { data, error } = await supabase.rpc('mark_pay_tomorrow', {
          p_shop_id: shop.shop_id,
          p_notes: notes || 'Payment deferred to tomorrow'
        })

        if (error) throw error

        if (data && data.success) {
          setMessage('✅ Payment deferred to tomorrow!')
          setTimeout(() => {
            onSuccess()
          }, 1500) // Show message for 1.5 seconds then close
        } else {
          throw new Error(data?.error || 'Failed to mark as pay tomorrow')
        }
      } else {
        setMessage('ℹ️ Payment already deferred to tomorrow')
        setTimeout(() => {
          onSuccess()
        }, 1500)
      }
    } catch (err: any) {
      console.error('Error marking pay tomorrow:', err)
      setError(err.message || 'Failed to mark as pay tomorrow')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-lg sm:rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto" data-testid="payment-modal">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Collect Payment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Shop Info with Status */}
          <div className={`border rounded-lg p-4 ${
            shop.status === 'paid'
              ? 'bg-green-50 border-green-200'
              : shop.status === 'partial'
              ? 'bg-yellow-50 border-yellow-200'
              : shop.status === 'pay_tomorrow'
              ? 'bg-orange-50 border-orange-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-semibold ${
                  shop.status === 'paid'
                    ? 'text-green-900'
                    : shop.status === 'partial'
                    ? 'text-yellow-900'
                    : shop.status === 'pay_tomorrow'
                    ? 'text-orange-900'
                    : 'text-red-900'
                }`}>
                  {shop.shop_name}
                </h3>
                {shop.shop_owner && (
                  <p className={`text-sm ${
                    shop.status === 'paid'
                      ? 'text-green-700'
                      : shop.status === 'partial'
                      ? 'text-yellow-700'
                      : shop.status === 'pay_tomorrow'
                      ? 'text-orange-700'
                      : 'text-red-700'
                  }`}>
                    Owner: {shop.shop_owner}
                  </p>
                )}
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                shop.status === 'paid'
                  ? 'bg-green-100 text-green-800'
                  : shop.status === 'partial'
                  ? 'bg-yellow-100 text-yellow-800'
                  : shop.status === 'pay_tomorrow'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {shop.status === 'paid' ? 'Fully Paid' : shop.status === 'partial' ? 'Partially Paid' : shop.status === 'pay_tomorrow' ? 'Pay Tomorrow' : 'Pending'}
              </div>
            </div>
          </div>

          {/* Amount Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Today's Pending:</span>
              <span className="font-semibold text-gray-900">₹{todayAmount.toFixed(2)}</span>
            </div>
            {oldAmount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Old Pending:</span>
                <span className="font-semibold text-gray-900">₹{oldAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t border-gray-200 pt-2">
              <span className="text-sm font-semibold text-gray-900">Total Pending:</span>
              <span className="text-lg font-bold text-blue-600">₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {message && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start space-x-2">
              <div className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0">✅</div>
              <p className="text-sm text-green-800">{message}</p>
            </div>
          )}

          {/* Quick Payment Buttons */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Quick Payment</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handlePaymentTypeChange('today')}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  paymentType === 'today'
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Today Only
                <div className="text-xs text-gray-600">₹{todayAmount.toFixed(2)}</div>
              </button>
              
              {oldAmount > 0 && (
                <button
                  onClick={() => handlePaymentTypeChange('old')}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    paymentType === 'old'
                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Old Pending
                  <div className="text-xs text-gray-600">₹{oldAmount.toFixed(2)}</div>
                </button>
              )}
              
              <button
                onClick={() => handlePaymentTypeChange('total')}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  paymentType === 'total'
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Full Amount
                <div className="text-xs text-gray-600">₹{totalAmount.toFixed(2)}</div>
              </button>
              
              <button
                onClick={() => handlePaymentTypeChange('custom')}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  paymentType === 'custom'
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          {/* Payment Status Sections */}
          {shop.status === 'partial' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-sm font-medium text-yellow-800">Partially Paid Status</span>
              </div>
              <div className="text-xs text-yellow-700">
                This shop has already paid ₹{shop.today_paid?.toFixed(2) || '0.00'} today.
                Remaining: ₹{todayAmount.toFixed(2)}
              </div>
            </div>
          )}

          {shop.status === 'paid' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">Fully Paid Today</span>
              </div>
              <div className="text-xs text-green-700">
                This shop has completed today's payment of ₹{shop.today_paid?.toFixed(2) || '0.00'}
              </div>
            </div>
          )}

          {shop.status === 'pay_tomorrow' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span className="text-sm font-medium text-orange-800">Payment Deferred</span>
              </div>
              <div className="text-xs text-orange-700">
                This shop's payment has been deferred to tomorrow.
                Amount: ₹{todayAmount.toFixed(2)}
              </div>
            </div>
          )}


          {/* Custom Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                step="0.01"
                min="0"
                max={totalAmount}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this payment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Amount to pay:</span>
            <span className="text-lg font-bold text-blue-600">
              ₹{paymentAmount ? parseFloat(paymentAmount).toFixed(2) : '0.00'}
            </span>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={processing}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={!paymentAmount || processing}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {processing ? 'Processing...' : 'Process Payment'}
            </button>
          </div>

          {/* Process Payment Button - Only show if there's today's amount and not already deferred */}
          {todayAmount > 0 && shop.status !== 'pay_tomorrow' && (
            <div className="mt-3">
              <button
                onClick={handlePayTomorrow}
                disabled={processing}
                className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                <Clock className="w-4 h-4" />
                <span>Process Payment</span>
              </button>
              <p className="text-xs text-gray-500 mt-1 text-center">
                Move today's payment to tomorrow's pending list
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

