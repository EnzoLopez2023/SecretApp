/**
 * App.tsx - Main Application Router and Layout Manager
 * 
 * WHAT THIS FILE DOES:
 * This is the "central hub" of the application that:
 * 1. 🧭 NAVIGATION: Manages which page/view the user is currently viewing
 * 2. 🎨 LAYOUT: Controls the overall app structure (sidebar + main content)
 * 3. 📱 RESPONSIVE: Adapts layout for mobile vs desktop screens
 * 4. 🔗 ROUTING: Shows different components based on user selection
 * 
 * LEARNING CONCEPTS FOR STUDENTS:
 * - React state management with useState
 * - Conditional rendering (showing different components based on state)
 * - TypeScript union types (AppView = 'dashboard' | 'chat' | ...)
 * - Props passing (sending data between parent and child components)
 * - Responsive design with Material-UI breakpoints
 * - Component composition (building larger components from smaller ones)
 * 
 * APP STRUCTURE:
 * ┌─────────────────────────────────────────────────────────────┐
 * │                        App.tsx                              │
 * │  ┌─────────────┐  ┌─────────────────────────────────────┐   │
 * │  │ Dashboard   │  │            Other Views              │   │
 * │  │ (Homepage)  │  │  ┌─────────────┐ ┌─────────────────┐ │   │
 * │  │             │  │  │ Sidebar     │ │ Main Content    │ │   │
 * │  │             │  │  │ Navigation  │ │ (Chat/Shop/etc) │ │   │
 * │  │             │  │  │             │ │                 │ │   │
 * │  └─────────────┘  │  └─────────────┘ └─────────────────┘ │   │
 * │                   └─────────────────────────────────────────┘   │
 * └─────────────────────────────────────────────────────────────┘
 */

// Import React hooks
import { useState, Suspense } from 'react'

// Import Material-UI layout components
import { Box, CircularProgress, Typography } from '@mui/material'

// Import core components (always loaded)
import Dashboard from './Dashboard'                    // Homepage with overview
import NavigationSidebar from './NavigationSidebar'   // Left sidebar menu

// Dynamic imports for code splitting (loaded on-demand)
import { lazy } from 'react'
const ChatApp = lazy(() => import('./ChatApp'))                       // AI chat interface
const ExcelToJsonConverter = lazy(() => import('./ExcelToJsonConverter'))  // Data conversion tool
const MyShopTools = lazy(() => import('./MyShopTools'))               // Woodworking shop management
const PlexMovieInsights = lazy(() => import('./PlexMovieInsights'))   // Movie library insights
const WoodworkingProjects = lazy(() => import('./WoodworkingProjects'))  // Project management
const PlexAPIClient = lazy(() => import('./PlexAPIClient'))           // Plex API testing client
const PlaylistCreator = lazy(() => import('./PlaylistCreator'))       // Intelligent playlist creation tool
const HomeMaintenanceTracker = lazy(() => import('./HomeMaintenanceTracker'))  // Home maintenance tracking system

// Import CSS styles
import './App.css'

/**
 * TypeScript Union Type for App Views
 * 
 * WHAT THIS DOES: Defines all the possible pages/views in our app
 * WHY IT'S USEFUL: TypeScript will catch typos and ensure we only use valid view names
 * 
 * EXAMPLE: If you try to set currentView to 'chatt' (typo), TypeScript will error
 * before you even run the code!
 */
type AppView = 'dashboard' | 'chat' | 'shop' | 'halloween' | 'woodworking' | 'converter' | 'plex-api' | 'playlist-creator' | 'home-maintenance'

/**
 * Main App Component
 * This is the root component that orchestrates the entire application
 */
export default function App() {
  // ============================================================================================
  // STATE MANAGEMENT
  // ============================================================================================
  
  /**
   * Current view state - tracks which page the user is viewing
   * 
   * REACT CONCEPT: useState returns [currentValue, setterFunction]
   * - currentView: the current value ('dashboard', 'chat', etc.)
   * - setCurrentView: function to change the value
   * 
   * When setCurrentView is called, React re-renders the component with the new value
   */
  const [currentView, setCurrentView] = useState<AppView>('dashboard')

  /**
   * Navigation helper function
   * 
   * WHY SEPARATE FUNCTION: Makes it easy to pass navigation capability to child components
   * CHILD COMPONENTS: Can call this function to change the current view
   */
  const navigateToView = (view: AppView) => setCurrentView(view)

  // ============================================================================================
  // RENDER - What gets displayed on screen
  // ============================================================================================
  
  return (
    <>
      {/* 
        HOMEPAGE (Dashboard): Always rendered, but only visible when currentView is 'dashboard'
        The Dashboard component handles its own visibility logic
      */}
      <Dashboard currentView={currentView} onNavigate={navigateToView} />
      
      {/* 
        OTHER PAGES: Only show the sidebar + main content layout when NOT on dashboard
        
        CONDITIONAL RENDERING EXPLANATION:
        {condition && <JSX>} means "if condition is true, render the JSX"
        So this entire section only appears when currentView !== 'dashboard'
      */}
      {currentView !== 'dashboard' && (
        <Box sx={{ 
          display: 'flex',                                    // Use flexbox layout
          minHeight: '100vh',                                 // Full viewport height
          flexDirection: { xs: 'column', md: 'row' }          // Stack vertically on mobile, horizontally on desktop
        }}>
          {/* 
            SIDEBAR: Navigation menu on the left (desktop) or top (mobile)
            Gets currentView and navigateToView as props so it can:
            1. Highlight the current page
            2. Change pages when user clicks menu items
          */}
          <NavigationSidebar currentView={currentView} onNavigate={navigateToView} />
          
          {/* 
            MAIN CONTENT AREA: Takes up remaining space after sidebar
          */}
          <Box sx={{ 
            flexGrow: 1,                                       // Take up remaining space
            minWidth: 0,                                       // Prevent flex overflow on mobile
            width: { xs: '100%', md: 'auto' }                 // Full width on mobile, auto on desktop
          }}>
            {/* 
              CONDITIONAL PAGE RENDERING: Show different components based on currentView
              
              LEARNING POINT: Each condition checks if currentView matches a specific value
              Only ONE of these will be true at a time, so only ONE component renders
              
              CODE SPLITTING: Lazy components are wrapped in Suspense for loading states
            */}
            <Suspense fallback={
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                minHeight: '50vh',
                gap: 2 
              }}>
                <CircularProgress size={40} />
                <Typography variant="body2" color="text.secondary">
                  Loading component...
                </Typography>
              </Box>
            }>
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
              {currentView === 'plex-api' && (
                <PlexAPIClient />
              )}
              {currentView === 'playlist-creator' && (
                <PlaylistCreator />
              )}
              {currentView === 'home-maintenance' && (
                <HomeMaintenanceTracker />
              )}
            </Suspense>
          </Box>
        </Box>
      )}
    </>
  )
}
