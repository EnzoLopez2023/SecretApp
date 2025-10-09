import { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from './msalConfig';
import './LoginPage.css';

export default function LoginPage() {
  const { instance } = useMsal();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await instance.loginRedirect(loginRequest);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to sign in right now.';
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">SecretApp</h1>
        <p className="login-subtitle">Sign in with your Microsoft 365 account to continue.</p>
        <button className="login-button" onClick={handleLogin} disabled={isSubmitting}>
          {isSubmitting ? 'Redirecting…' : 'Sign in with Microsoft'}
        </button>
        {error && <div className="login-error">{error}</div>}
      </div>
    </div>
  );
}
