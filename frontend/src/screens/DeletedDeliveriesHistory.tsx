import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Trash2 } from 'lucide-react'

interface DeletedDeliveriesHistoryProps {
  onBack?: () => void
}

interface DeletedRow {
  id: string
  delivery_id: string
  shop_id: string
  products: any[]
  total_amount: number
  deleted_at: string
}

export default function DeletedDeliveriesHistory({ onBack }: DeletedDeliveriesHistoryProps) {
  const [rows, setRows] = useState<DeletedRow[]>([])
  const [loading, setLoading] = useState(true)

  const loadHistory = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('deleted_deliveries')
        .select('*')
        .order('deleted_at', { ascending: false })

      if (error) throw error
      setRows(data || [])
    } catch (e) {
      console.error('Error loading deleted deliveries:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {onBack && (
            <button onClick={onBack} className="px-3 py-2 rounded-lg hover:bg-gray-100">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <h2 className="text-lg font-bold text-gray-900">Deleted Deliveries History</h2>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No deleted deliveries found.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {rows.map(row => (
              <div key={row.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Trash2 className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-gray-600">
                        {new Date(row.deleted_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-900 font-medium">
                      Total: ₹{Number(row.total_amount || 0).toFixed(2)}
                    </div>
                    <div className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                      {(Array.isArray(row.products) ? row.products : []).map((p: any) => `${p.name} x${p.quantity}`).join('\n')}
                    </div>
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


