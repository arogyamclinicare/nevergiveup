import { Home, Store, Settings } from 'lucide-react'

type Tab = 'home' | 'shops' | 'settings'

interface BottomNavProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  userRole?: string
  onLogout?: () => void
}

export default function BottomNav({ activeTab, onTabChange, userRole }: BottomNavProps) {
  // Role-based navigation
  const getTabsForRole = (role: string) => {
    const allTabs = [
      { id: 'home' as Tab, icon: Home, label: 'Home' },
      { id: 'shops' as Tab, icon: Store, label: 'Shops' },
      { id: 'settings' as Tab, icon: Settings, label: 'Settings' },
    ]
    
    if (role === 'staff') {
      // Staff can access everything except settings
      return allTabs.filter(tab => tab.id !== 'settings')
    }
    
    // Owner can access everything
    return allTabs
  }

  const tabs = getTabsForRole(userRole || 'owner')

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 ${isActive ? 'stroke-2' : 'stroke-1.5'}`} />
              <span className={`text-xs ${isActive ? 'font-semibold' : 'font-normal'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}


