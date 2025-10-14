import { ReactNode } from 'react'
import { LogOut } from 'lucide-react'

interface AppLayoutProps {
  children: ReactNode
  title?: string
  showBackButton?: boolean
  onBack?: () => void
  showLogoutButton?: boolean
  onLogout?: () => void
}

export default function AppLayout({ 
  children, 
  title, 
  showBackButton = false,
  onBack,
  showLogoutButton = false,
  onLogout
}: AppLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      {title && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center">
              {showBackButton && (
                <button
                  onClick={onBack}
                  className="mr-3 p-2 -ml-2 text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            </div>
            
            {showLogoutButton && onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 text-red-600 hover:text-red-800 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            )}
          </div>
        </header>
      )}

      {/* Main Content - scrollable with mobile-optimized bottom padding */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>
    </div>
  )
}


