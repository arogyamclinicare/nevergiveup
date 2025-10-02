import { ReactNode } from 'react'

interface AppLayoutProps {
  children: ReactNode
  title?: string
  showBackButton?: boolean
  onBack?: () => void
}

export default function AppLayout({ 
  children, 
  title, 
  showBackButton = false,
  onBack 
}: AppLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      {title && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center h-14 px-4">
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
        </header>
      )}

      {/* Main Content - scrollable */}
      <main className="flex-1 overflow-y-auto pb-16">
        {children}
      </main>
    </div>
  )
}


