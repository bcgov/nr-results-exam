window.global ||= window;
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import React from "react";
import "./index.css";
import { ClassPrefix } from "@carbon/react";
import App from "./App";
import { ThemePreference } from "./utils/ThemePreference";
import { createRoot } from "react-dom/client";
import { Amplify } from "aws-amplify";
import { CookieStorage } from "aws-amplify/utils";
import { cognitoUserPoolsTokenProvider } from "aws-amplify/auth/cognito";
import amplifyconfig from "./amplifyconfiguration";
import { AuthProvider } from "./contexts/AuthProvider";
import { getFrontendOrigin } from "./amplifyconfiguration";

/**
 * Get the frontend hostname (with -frontend suffix) for cookie domain.
 * This ensures cookies work correctly even when accessed via redirect-from URL.
 */
const getFrontendHostname = (): string => {
  const origin = getFrontendOrigin();
  try {
    return new URL(origin).hostname;
  } catch {
    // Fallback to current hostname if URL parsing fails
    return window.location.hostname;
  }
};

// Ensure we're on the -frontend URL before configuring Amplify
// This prevents OAuth redirect URIs from using the wrong URL format
const frontendOrigin = getFrontendOrigin();
if (window.location.origin !== frontendOrigin) {
  // Redirect to -frontend URL before any OAuth processing
  console.log('Redirecting to -frontend URL:', frontendOrigin);
  window.location.replace(frontendOrigin + window.location.pathname + window.location.search + window.location.hash);
  // Exit early - the redirect will cause this script to re-run on the correct URL
  throw new Error('Redirecting to frontend URL');
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}
const root = createRoot(container);

Amplify.configure(amplifyconfig);
// Configure CookieStorage with security attributes for session management
// See docs/COOKIE_SECURITY.md for detailed documentation
// Use frontend hostname to ensure cookies work with both URL formats
cognitoUserPoolsTokenProvider.setKeyValueStorage(
  new CookieStorage({
    domain: getFrontendHostname(),
    path: '/',
    expires: 365,
    sameSite: 'lax',
    secure: true
  })
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
  </React.StrictMode>
);
