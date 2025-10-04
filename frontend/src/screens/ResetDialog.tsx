import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { AlertTriangle, CheckCircle, Clock, DollarSign, Archive, X } from 'lucide-react'

interface ResetPreviewData {
  total_deliveries: number
  paid_deliveries: number
  pending_deliveries: number
  partial_deliveries: number
  total_paid_amount: number
  total_pending_amount: number
  shops_with_pending: number
}

interface ResetDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ResetDialog({ isOpen, onClose, onSuccess }: ResetDialogProps) {
  const [previewData, setPreviewData] = useState<ResetPreviewData | null>(null)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)


  useEffect(() => {
    if (isOpen) {
      fetchResetPreview()
    }
  }, [isOpen])

  const fetchResetPreview = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.rpc('get_reset_preview_data', {
        p_date: new Date().toISOString().split('T')[0]
      })

      if (error) throw error

      if (data && data.length > 0) {
        setPreviewData(data[0])
      }
    } catch (err: any) {
      console.error('Error fetching reset preview:', err)
      setError(err.message || 'Failed to load reset preview')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    try {
      setProcessing(true)
      setError(null)
      console.log('🔄 Starting reset process...')

      const today = new Date().toISOString().split('T')[0]
      console.log('📅 Reset date:', today)

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Reset timeout - operation took too long')), 30000)
      )

      const resetPromise = supabase.rpc('process_daily_reset', {
        p_date: today
      })

      console.log('🚀 Calling process_daily_reset with date:', today)
      const result = await Promise.race([resetPromise, timeoutPromise]) as any
      const { data, error } = result

      console.log('📊 Reset response:', { data, error })

      if (error) {
        console.error('Reset error:', error)
        throw error
      }

      // Handle the response - data is a single object, not an array
      if (data && data.success) {
        console.log('Reset successful:', data)
        setSuccess(true)
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1500)
      } else if (data && data.message) {
        // Handle case where function returns a message
        console.log('Reset successful:', data)
        setSuccess(true)
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1500)
      } else {
        console.error('Reset failed:', data)
        throw new Error(data?.error || 'Reset failed')
      }
    } catch (err: any) {
      console.error('Error processing reset:', err)
      setError(err.message || 'Failed to process reset')
    } finally {
      setProcessing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Archive className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Daily Reset</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {success ? (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reset Complete!</h3>
              <p className="text-sm text-gray-600">
                Daily reset has been processed successfully.
              </p>
            </div>
          ) : (
            <>
              {/* Warning */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-orange-800">Important Warning</h3>
                    <p className="text-xs text-orange-700 mt-1">
                      This action will archive paid deliveries and move pending amounts to history. 
                      This cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview Data */}
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading reset preview...</p>
                </div>
              ) : previewData ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">Reset Preview</h3>
                  
                  {/* Delivery Summary */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Deliveries:</span>
                        <span className="font-medium">{previewData.total_deliveries}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Paid Deliveries:</span>
                        <span className="font-medium text-green-600">{previewData.paid_deliveries}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pending Deliveries:</span>
                        <span className="font-medium text-orange-600">{previewData.pending_deliveries}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Partial Deliveries:</span>
                        <span className="font-medium text-yellow-600">{previewData.partial_deliveries}</span>
                      </div>
                    </div>
                  </div>

                  {/* Amount Summary */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Paid Amount:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(previewData.total_paid_amount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Pending Amount:</span>
                        <span className="font-medium text-orange-600">
                          {formatCurrency(previewData.total_pending_amount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shops with Pending:</span>
                        <span className="font-medium">{previewData.shops_with_pending}</span>
                      </div>
                    </div>
                  </div>

                  {/* What will happen */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">What will happen:</h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• {previewData.paid_deliveries} paid deliveries will be archived</li>
                      <li>• {previewData.pending_deliveries + previewData.partial_deliveries} pending/partial deliveries will be moved to history</li>
                      <li>• {formatCurrency(previewData.total_pending_amount)} will be added to pending history</li>
                      <li>• New day will start with clean delivery records</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600">No data available for reset</p>
                  <p className="text-xs text-gray-500 mt-1">All deliveries have already been processed</p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={processing}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4" />
                    <span>Reset Daily Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
