import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import './index.css'
import App from './App.tsx'
import { msalConfig } from './auth/msalConfig'
import AuthGuard from './auth/AuthGuard'

const msalInstance = new PublicClientApplication(msalConfig)

msalInstance
  .initialize()
  .then(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <MsalProvider instance={msalInstance}>
          <AuthGuard>
            <App />
          </AuthGuard>
        </MsalProvider>
      </StrictMode>,
    )
  })
  .catch((error) => {
    console.error('Failed to initialize MSAL', error)
  })
