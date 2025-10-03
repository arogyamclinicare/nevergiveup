import { useState } from 'react'
import { Archive, AlertTriangle, Clock, DollarSign, Settings as SettingsIcon } from 'lucide-react'
import ResetDialog from './ResetDialog'

export default function SettingsScreen() {
  const [showResetDialog, setShowResetDialog] = useState(false)

  const handleResetSuccess = () => {
    // Refresh the app or show success message
    window.location.reload()
  }

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-3">
        <SettingsIcon className="w-5 h-5 text-gray-600" />
        <h1 className="text-lg font-bold text-gray-900">Settings</h1>
      </div>


      {/* Daily Reset Section */}
      <div className="bg-white rounded-lg border border-gray-100">
        <div className="p-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Daily Operations</h3>
          <p className="text-xs text-gray-500">End-of-day procedures</p>
        </div>
        
        <div className="p-3">
          <button
            onClick={() => setShowResetDialog(true)}
            className="w-full bg-orange-600 text-white rounded-lg p-3 font-medium hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Archive className="w-4 h-4" />
            <span>Daily Reset</span>
          </button>
          
          <div className="mt-2 text-xs text-gray-500">
            <p>• Archives paid deliveries</p>
            <p>• Moves pending to history</p>
            <p>• Prepares for new day</p>
          </div>
        </div>
      </div>

      {/* App Information */}
      <div className="bg-white rounded-lg border border-gray-100">
        <div className="p-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">App Information</h3>
        </div>
        
        <div className="p-3 space-y-2 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Version:</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Database:</span>
            <span className="font-medium">Supabase</span>
          </div>
          <div className="flex justify-between">
            <span>Framework:</span>
            <span className="font-medium">React + TypeScript</span>
          </div>
        </div>
      </div>


             {/* Reset Dialog */}
             <ResetDialog
               isOpen={showResetDialog}
               onClose={() => setShowResetDialog(false)}
               onSuccess={handleResetSuccess}
             />
    </div>
  )
}


