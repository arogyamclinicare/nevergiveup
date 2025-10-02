import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Calendar, RotateCcw, AlertCircle } from 'lucide-react'

interface TestControlsProps {
  onDateChange: () => void
}

export default function TestControls({ onDateChange }: TestControlsProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const simulateTomorrow = async () => {
    try {
      setIsProcessing(true)
      setMessage(null)

      // Get today's date for reset (process today's deliveries)
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]

      // Call the process_daily_reset function to simulate day change
      const { data, error } = await supabase.rpc('process_daily_reset', {
        p_date: todayStr
      })

      if (error) throw error

      if (data && data.success) {
        setMessage(`✅ Simulated tomorrow! Processed ${data.processed_deliveries} deliveries.`)
        onDateChange() // Trigger refresh
      } else {
        throw new Error('Failed to simulate tomorrow')
      }
    } catch (err: any) {
      console.error('Error simulating tomorrow:', err)
      setMessage(`❌ Error: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const resetTestData = async () => {
    try {
      setIsProcessing(true)
      setMessage(null)

      // Clean up all test data
      const { error } = await supabase
        .from('deliveries')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

      if (error) throw error

      // Also clean pending history and payments
      await supabase.from('shop_pending_history').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('activity_log').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      setMessage('✅ All test data cleared! Fresh start ready.')
      onDateChange() // Trigger refresh
    } catch (err: any) {
      console.error('Error resetting data:', err)
      setMessage(`❌ Error: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-center space-x-2 mb-3">
        <Calendar className="w-5 h-5 text-yellow-600" />
        <h3 className="font-semibold text-yellow-800">Test Controls</h3>
      </div>
      
      <p className="text-sm text-yellow-700 mb-4">
        Use these controls to test multi-day scenarios without waiting!
      </p>

      <div className="space-y-3">
        <button
          onClick={simulateTomorrow}
          disabled={isProcessing}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          <Calendar className="w-4 h-4" />
          <span>{isProcessing ? 'Simulating...' : 'Simulate Tomorrow'}</span>
        </button>

        <button
          onClick={resetTestData}
          disabled={isProcessing}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{isProcessing ? 'Resetting...' : 'Reset All Test Data'}</span>
        </button>
      </div>

      {message && (
        <div className={`mt-3 p-3 rounded-lg flex items-start space-x-2 ${
          message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{message}</p>
        </div>
      )}
    </div>
  )
}
