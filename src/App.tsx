import { useState } from 'react'
import { Box } from '@mui/material'
import Dashboard from './Dashboard'
import NavigationSidebar from './NavigationSidebar'
import ChatApp from './ChatApp'
import ExcelToJsonConverter from './ExcelToJsonConverter'
import MyShopTools from './MyShopTools'
import PlexMovieInsights from './PlexMovieInsights'
import WoodworkingProjects from './WoodworkingProjects'
import './App.css'

type AppView = 'dashboard' | 'chat' | 'shop' | 'halloween' | 'woodworking' | 'converter'

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('dashboard')

  const navigateToView = (view: AppView) => setCurrentView(view)

  return (
    <>
      {/* Dashboard - includes its own sidebar */}
      <Dashboard currentView={currentView} onNavigate={navigateToView} />
      
      {/* Other pages - with shared navigation sidebar */}
      {currentView !== 'dashboard' && (
        <Box sx={{ 
          display: 'flex', 
          minHeight: '100vh',
          flexDirection: { xs: 'column', md: 'row' } // Stack vertically on mobile
        }}>
          <NavigationSidebar currentView={currentView} onNavigate={navigateToView} />
          <Box sx={{ 
            flexGrow: 1,
            minWidth: 0, // Prevent flex overflow on mobile
            width: { xs: '100%', md: 'auto' }
          }}>
            {currentView === 'chat' && (
              <ChatApp />
            )}
            {currentView === 'shop' && (
              <MyShopTools />
            )}
            {currentView === 'halloween' && (
              <PlexMovieInsights />
            )}
            {currentView === 'woodworking' && (
              <WoodworkingProjects />
            )}
            {currentView === 'converter' && (
              <ExcelToJsonConverter />
            )}
          </Box>
        </Box>
      )}
    </>
  )
}
