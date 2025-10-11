import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import './index.css'
import App from './App.tsx'
import { msalConfig } from './auth/msalConfig'
import AuthGuard from './auth/AuthGuard'

// Create MUI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    success: {
      main: '#10b981',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
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
