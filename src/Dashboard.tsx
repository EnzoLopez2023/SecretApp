/**
 * Dashboard.tsx - Homepage and Main Landing Page
 * 
 * WHAT THIS COMPONENT DOES:
 * This is the "homepage" of the application that users see when they first log in.
 * It provides:
 * 1. 🏠 WELCOME SCREEN: Personalized greeting with user information
 * 2. 🧭 NAVIGATION CARDS: Visual way to access different app features
 * 3. 📊 OVERVIEW: Quick access to all main application modules
 * 4. 👤 USER INFO: Display logged-in user details from Azure authentication
 * 5. 📱 RESPONSIVE LAYOUT: Works on both desktop and mobile devices
 * 
 * LEARNING CONCEPTS FOR STUDENTS:
 * - React props (receiving data from parent component)
 * - TypeScript interfaces (defining component prop types)
 * - Conditional rendering (only show when currentView is 'dashboard')
 * - Material-UI Grid system for responsive layouts
 * - Event handling (onClick navigation)
 * - Azure MSAL authentication integration
 * - Component composition and reusability
 * 
 * USER EXPERIENCE FLOW:
 * 1. User logs in through Azure authentication
 * 2. Dashboard appears with personalized welcome
 * 3. User sees cards for each app feature
 * 4. User clicks a card to navigate to that feature
 * 5. Dashboard hides and selected feature appears
 */

// Import React (required for JSX)
import React from 'react';

// Import Material-UI components for beautiful UI
import {
  Box,           // Generic container component
  AppBar,        // Top navigation bar
  Toolbar,       // Container for AppBar content
  Typography,    // Text display with consistent styling
  Card,          // Container with shadow/elevation effect
  CardContent,   // Content area inside a Card
  Button,        // Clickable button component
} from '@mui/material';

// Import Material-UI icons for visual elements
import {
  Chat as ChatIcon,           // Chat/message icon
  Store as StoreIcon,         // Shop/store icon
  Movie as MovieIcon,         // Movie/film icon
  Carpenter as CarpenterIcon, // Woodworking/tools icon
  TableChart as ConverterIcon,// Data/spreadsheet icon
  HomeRepairService as MaintenanceIcon, // Home maintenance icon
  AccountCircle as AccountIcon, // User profile icon
} from '@mui/icons-material';

// Import Azure authentication hook
import { useMsal } from '@azure/msal-react';

// Import other components
import NavigationSidebar from './NavigationSidebar';  // Left sidebar navigation
import VersionDisplay from './components/VersionDisplay';  // App version info

// ============================================================================================
// TYPESCRIPT INTERFACES - Define the shape of data this component expects
// ============================================================================================

/**
 * AppView Type - All possible pages in the application
 * This must match the same type definition in App.tsx
 */
type AppView = 'dashboard' | 'chat' | 'shop' | 'halloween' | 'woodworking' | 'converter' | 'plex-api' | 'playlist-creator' | 'home-maintenance';

/**
 * DashboardProps Interface - Defines what props this component receives
 * 
 * LEARNING POINT: Props are how parent components pass data to child components
 * Think of props like function parameters, but for React components
 */
interface DashboardProps {
  currentView: AppView;                      // Which page is currently active
  onNavigate: (view: AppView) => void;       // Function to change the current page
}

/**
 * Dashboard Component - The main homepage component
 * 
 * REACT COMPONENT EXPLANATION:
 * This is a "functional component" - it's literally a function that returns JSX
 * JSX is a syntax that looks like HTML but is actually JavaScript
 * 
 * PROPS DESTRUCTURING:
 * { currentView, onNavigate } extracts these properties from the props object
 * Instead of: function Dashboard(props) { const currentView = props.currentView; ... }
 * We can write: function Dashboard({ currentView, onNavigate }) { ... }
 */
export default function Dashboard({ currentView, onNavigate }: DashboardProps) {
  // ============================================================================================
  // AZURE AUTHENTICATION - Get user information
  // ============================================================================================
  
  /**
   * Azure MSAL Hook - Get authentication information
   * 
   * WHAT THIS DOES: useMsal() gives us access to user authentication data
   * The 'accounts' array contains information about logged-in users
   */
  const { accounts } = useMsal();

  // Extract user information from the first (primary) account
  const account = accounts[0];
  const userName = account?.name || 'User';        // User's display name, or 'User' if not available
  const userEmail = account?.username || '';       // User's email address

  // ============================================================================================
  // NAVIGATION MENU CONFIGURATION
  // ============================================================================================
  
  /**
   * Menu Items Array - Configuration for dashboard navigation cards
   * 
   * LEARNING CONCEPTS:
   * - Array of objects (each object represents one navigation card)
   * - Object properties (id, label, icon, color)
   * - JSX elements stored in variables (icon property contains React elements)
   * - Color theming for visual differentiation
   */
  const menuItems = [
    { id: 'chat', label: 'AI Assistant', icon: <ChatIcon />, color: '#4CAF50' },
    { id: 'shop', label: 'Shop Tools Manager', icon: <StoreIcon />, color: '#6366f1' },
    { id: 'home-maintenance', label: 'Home Maintenance', icon: <MaintenanceIcon />, color: '#10b981' },
    { id: 'woodworking', label: 'Project Workshop', icon: <CarpenterIcon />, color: '#f59e0b' },
    { id: 'halloween', label: 'Media Library', icon: <MovieIcon />, color: '#ff9800' },
    { id: 'converter', label: 'Data Converter', icon: <ConverterIcon />, color: '#9c27b0' },
  ];

  // ============================================================================================
  // CONDITIONAL RENDERING - Only show dashboard on the dashboard page
  // ============================================================================================
  
  /**
   * Early Return Pattern
   * 
   * WHAT THIS DOES: If we're not on the dashboard page, return null (render nothing)
   * WHY: The Dashboard component is always mounted in App.tsx, but we only want to 
   * show it when the user is actually on the dashboard page
   * 
   * LEARNING POINT: Returning null from a React component makes it invisible
   */
  if (currentView !== 'dashboard') {
    return null; // Don't render dashboard when on other pages
  }

  // ============================================================================================
  // MAIN RENDER - What gets displayed when component is visible
  // ============================================================================================
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Navigation Sidebar */}
      <NavigationSidebar currentView={currentView} onNavigate={onNavigate} showOnDashboard={true} />

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, bgcolor: '#f1f5f9' }}>
        {/* Top App Bar */}
        <AppBar 
          position="static" 
          elevation={0}
          sx={{ 
            bgcolor: 'white', 
            color: 'text.primary',
            borderBottom: '1px solid #e2e8f0'
          }}
        >
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
              Workshop Studio
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <VersionDisplay variant="chip" size="small" />
              <Typography variant="body2" color="text.secondary">
                Welcome, {userName}!
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Dashboard Content */}
        <Box sx={{ p: 4 }}>
          {/* Welcome Section */}
          <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                <AccountIcon sx={{ fontSize: 48, mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                    Welcome to Workshop Studio
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    🛠️ Your Personal Productivity & Maker's Hub
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1, opacity: 0.8 }}>
                    Manage your projects, tools, media library, and more - all in one place.
                  </Typography>
                  <Box sx={{ mt: 2, opacity: 0.7 }}>
                    <VersionDisplay variant="text" size="medium" />
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card sx={{ mb: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <AccountIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Your Account Information
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Name:
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {userName}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Email:
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {userEmail}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Account ID:
                  </Typography>
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: '#f8fafc',
                      borderRadius: 1,
                      border: '1px solid #e2e8f0',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      wordBreak: 'break-all',
                      color: 'text.secondary',
                    }}
                  >
                    {account?.localAccountId || account?.homeAccountId || 'N/A'}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Quick Access Apps */}
          <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
            Quick Access
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: 2 
          }}>
            {menuItems.map((item) => (
              <Card 
                key={item.id}
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  }
                }}
                onClick={() => onNavigate(item.id as AppView)}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box sx={{ color: item.color, mb: 1 }}>
                    {React.cloneElement(item.icon, { sx: { fontSize: 32 } })}
                  </Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {item.label}
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small"
                    sx={{ 
                      borderColor: item.color,
                      color: item.color,
                      '&:hover': {
                        borderColor: item.color,
                        backgroundColor: `${item.color}10`,
                      }
                    }}
                  >
                    Open App
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}