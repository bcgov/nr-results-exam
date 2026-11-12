import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleCallback } from '../../services/keycloak';
import { Loading } from '@carbon/react';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const hasHandledRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Guard against React 19 StrictMode double-mounting in dev
    // Authorization code is single-use; exchanging twice throws an error
    if (hasHandledRef.current) {
      return;
    }
    hasHandledRef.current = true;

    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    async function completeAuth() {
      try {
        await handleCallback();
        void navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error('Error during authentication callback:', err);
        setError('Authentication failed. Returning to login...');
        redirectTimer = setTimeout(() => {
          void navigate('/', { replace: true });
        }, 2000);
      }
    }

    void completeAuth();

    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [navigate]);

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
    >
      <Loading description="Completing login..." withOverlay={false} />
    </div>
  );
};

export default AuthCallback;
