import { useEffect } from 'react';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import type { ReactNode } from 'react';
import LoginPage from './LoginPage';
import './LoginPage.css';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const isAuthenticated = useIsAuthenticated();
  const { instance, inProgress } = useMsal();

  useEffect(() => {
    const accounts = instance.getAllAccounts();
    if (!instance.getActiveAccount() && accounts.length > 0) {
      instance.setActiveAccount(accounts[0]);
    }
  }, [instance, isAuthenticated]);

  if (inProgress === 'login' || inProgress === 'handleRedirect') {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">Signing you in…</h1>
          <p className="login-subtitle">Please wait while we complete authentication.</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
