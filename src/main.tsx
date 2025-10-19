/**
 * main.tsx - Application Entry Point and Root Configuration
 * 
 * WHAT THIS FILE DOES:
 * This is the "starting point" of the entire React application. It:
 * 1. 🚀 BOOTSTRAPS: Initializes and starts the React application
 * 2. 🔐 AUTHENTICATION: Sets up Azure Active Directory login system
 * 3. 🎨 THEMING: Configures Material-UI theme and styling
 * 4. 🔒 SECURITY: Wraps app in authentication guards
 * 5. 🌐 DOM MOUNTING: Attaches the React app to the HTML page
 * 
 * LEARNING CONCEPTS FOR STUDENTS:
 * - React application initialization
 * - Provider pattern (wrapping components to share data/functionality)
 * - Dependency injection (making services available throughout the app)
 * - Theme configuration and design systems
 * - Authentication integration
 * - CSS-in-JS styling
 * - Component composition and nesting
 * 
 * EXECUTION ORDER:
 * 1. Browser loads HTML page with <div id="root">
 * 2. This file runs and creates React root
 * 3. Sets up authentication, theming, and other providers
 * 4. Renders the App component inside all the providers
 * 5. App.tsx takes over and manages the rest of the application
 * 
 * PROVIDER WRAPPER PATTERN:
 * Think of providers like "contexts" that make certain capabilities available
 * to all child components. For example:
 * - MsalProvider: Makes authentication available everywhere
 * - ThemeProvider: Makes consistent styling available everywhere
 * - AuthGuard: Ensures user is logged in before showing the app
 */

// Import React core functionality
import { StrictMode } from 'react'               // Development mode with extra checks
import { createRoot } from 'react-dom/client'   // Modern React 18 root creation

// Import Azure authentication components
import { PublicClientApplication } from '@azure/msal-browser'  // Azure AD authentication client
import { MsalProvider } from '@azure/msal-react'               // React wrapper for Azure AD

// Import Material-UI theme and styling components
import { ThemeProvider, createTheme } from '@mui/material/styles'  // Theme creation and provider
import { CssBaseline } from '@mui/material'                        // CSS reset and baseline styles

// Import our application components and configuration
import './index.css'                      // Global CSS styles
import App from './App.tsx'               // Main application component
import { msalConfig } from './auth/msalConfig'  // Azure AD configuration
import AuthGuard from './auth/AuthGuard'        // Authentication protection component

// ============================================================================================
// THEME CONFIGURATION - Design system for consistent UI
// ============================================================================================

/**
 * Material-UI Theme Creation
 * 
 * WHAT THEMES DO: Define colors, fonts, spacing, and other design elements
 * WHY WE USE THEM: Ensures consistent look and feel across the entire app
 * 
 * LEARNING CONCEPTS:
 * - Design systems and style guides
 * - Color theory (primary, secondary, complementary colors)
 * - Accessibility considerations (contrast ratios)
 * - Component styling inheritance
 */
const theme = createTheme({
  palette: {
    mode: 'light',           // Light theme (vs. dark theme)
    primary: {
      main: '#6366f1',       // Modern indigo - main brand color
      light: '#818cf8',      // Lighter variant for hover states
      dark: '#4f46e5',       // Darker variant for pressed states
      contrastText: '#ffffff', // Text color that contrasts well with primary
    },
    secondary: {
      main: '#ec4899',       // Modern pink - accent color
      light: '#f472b6',      // Lighter pink variant
      dark: '#db2777',       // Darker pink variant
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981',       // Modern emerald - for success messages
      light: '#34d399',      // Lighter success color
      dark: '#059669',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '12px',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          fontWeight: 500,
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
          },
        },
      },
    },
  },
})

const msalInstance = new PublicClientApplication(msalConfig)

msalInstance
  .initialize()
  .then(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <MsalProvider instance={msalInstance}>
            <AuthGuard>
              <App />
            </AuthGuard>
          </MsalProvider>
        </ThemeProvider>
      </StrictMode>,
    )
  })
  .catch((error) => {
    console.error('Failed to initialize MSAL', error)
  })
