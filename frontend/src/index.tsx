import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import React from 'react';
import './index.css';
import { ClassPrefix } from '@carbon/react';
import App from './App';
import { ThemePreference } from './utils/ThemePreference';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './contexts/AuthProvider';
const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}
const root = createRoot(container);

// Authentication is handled via Keycloak OIDC in AuthProvider
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
