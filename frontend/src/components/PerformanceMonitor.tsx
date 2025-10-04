import React, { useState, useEffect } from 'react'
import { Activity, Database, Clock, TrendingUp, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface PerformanceMetrics {
  queryPerformance: Array<{
    query_text: string
    mean_time: number
    calls: number
    total_time: number
  }>
  indexUsage: Array<{
    table_name: string
    index_name: string
    index_scans: number
    tuples_read: number
    tuples_fetched: number
  }>
  tableStats: Array<{
    table_name: string
    row_count: number
    table_size: string
    index_size: string
    total_size: string
  }>
  slowQueries: Array<{
    query_text: string
    mean_time: number
    calls: number
    total_time: number
  }>
  connectionStats: Array<{
    state: string
    count: number
  }>
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPerformanceMetrics()
  }, [])

  const loadPerformanceMetrics = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load all performance metrics
      const [
        queryPerformance,
        indexUsage,
        tableStats,
        slowQueries,
        connectionStats
      ] = await Promise.all([
        supabase.rpc('analyze_query_performance'),
        supabase.rpc('get_index_usage_stats'),
        supabase.rpc('get_table_stats'),
        supabase.rpc('get_slow_queries', { threshold_ms: 1000 }),
        supabase.rpc('get_connection_stats')
      ])

      if (queryPerformance.error) throw queryPerformance.error
      if (indexUsage.error) throw indexUsage.error
      if (tableStats.error) throw tableStats.error
      if (slowQueries.error) throw slowQueries.error
      if (connectionStats.error) throw connectionStats.error

      setMetrics({
        queryPerformance: queryPerformance.data || [],
        indexUsage: indexUsage.data || [],
        tableStats: tableStats.data || [],
        slowQueries: slowQueries.data || [],
        connectionStats: connectionStats.data || []
      })
    } catch (err) {
      console.error('Error loading performance metrics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load metrics')
    } finally {
      setLoading(false)
    }
  }

  const runMaintenance = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.rpc('maintenance_cleanup')
      if (error) throw error
      alert('Database maintenance completed successfully!')
      loadPerformanceMetrics()
    } catch (err) {
      console.error('Error running maintenance:', err)
      alert('Failed to run maintenance: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-2">
          <Activity className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Loading performance metrics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">Error: {error}</p>
        </div>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Monitor</h2>
          <p className="text-gray-600">Database performance metrics and optimization insights</p>
        </div>
        <button
          onClick={runMaintenance}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Run Maintenance
        </button>
      </div>

      {/* Connection Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Database className="w-5 h-5" />
          <span>Connection Statistics</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.connectionStats.map((stat, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">{stat.state}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Table Statistics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5" />
          <span>Table Statistics</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rows
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Index Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Size
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.tableStats.map((table, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {table.table_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {table.row_count.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {table.table_size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {table.index_size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {table.total_size}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slow Queries */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <span>Slow Queries (&gt;1000ms)</span>
        </h3>
        {metrics.slowQueries.length > 0 ? (
          <div className="space-y-4">
            {metrics.slowQueries.map((query, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-red-800">
                    Mean Time: {query.mean_time.toFixed(2)}ms
                  </span>
                  <span className="text-sm text-red-600">
                    Calls: {query.calls.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-red-700 font-mono bg-red-100 p-2 rounded">
                  {query.query_text.substring(0, 200)}...
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-green-600">No slow queries detected! 🎉</p>
        )}
      </div>

      {/* Index Usage */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Database className="w-5 h-5" />
          <span>Index Usage Statistics</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Index
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scans
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tuples Read
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tuples Fetched
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.indexUsage.map((index, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {index.table_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index.index_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index.index_scans.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index.tuples_read.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index.tuples_fetched.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
