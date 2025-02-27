window.global ||= window;
import React from 'react';
import './index.css';
import { ClassPrefix } from '@carbon/react';
import App from './App';
import { ThemePreference } from './utils/ThemePreference';
import { createRoot } from 'react-dom/client';
import {Amplify, type ResourcesConfig } from 'aws-amplify';
import { CookieStorage } from 'aws-amplify/utils';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import amplifyconfig from './amplifyconfiguration';
import { AuthProvider } from './contexts/AuthProvider';
const container:any = document.getElementById('root');
const root = createRoot(container);

Amplify.configure(amplifyconfig);
cognitoUserPoolsTokenProvider.setKeyValueStorage(new CookieStorage());
root.render(
  <React.StrictMode>
    <ClassPrefix prefix='bx'>
      <ThemePreference>
          <AuthProvider>
            <App />
          </AuthProvider>
      </ThemePreference>
    </ClassPrefix>
  </React.StrictMode>
);
