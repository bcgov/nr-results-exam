window.global ||= window;
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import React from 'react';
import './index.css';
import { ClassPrefix } from '@carbon/react';
import App from './App';
import { ThemePreference } from './utils/ThemePreference';
import { createRoot } from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import { CookieStorage } from 'aws-amplify/utils';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import amplifyconfig from './amplifyconfiguration';
import { AuthProvider } from './contexts/AuthProvider';
const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}
const root = createRoot(container);

Amplify.configure(amplifyconfig);
// Configure CookieStorage with security attributes for session management
// See docs/COOKIE_SECURITY.md for detailed documentation
cognitoUserPoolsTokenProvider.setKeyValueStorage(
  new CookieStorage({
    domain: window.location.hostname,
    path: '/',
    expires: 365,
    sameSite: 'lax',
    secure: true,
  }),
);
root.render(
  <React.StrictMode>
    <ClassPrefix prefix="bx">
      <ThemePreference>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemePreference>
    </ClassPrefix>
  </React.StrictMode>,
);
