window.global ||= window;
import React from "react";
import "./index.css";
import { ClassPrefix } from "@carbon/react";
import { Provider } from "react-redux";
import store from "./store";
import App from "./App";
import { ThemePreference } from "./utils/ThemePreference";
import { createRoot } from "react-dom/client";
import { Amplify } from "aws-amplify";
import { CookieStorage } from "aws-amplify/utils";
import { cognitoUserPoolsTokenProvider } from "aws-amplify/auth/cognito";
import amplifyconfig from "./amplifyconfiguration";
import { AuthProvider } from "./contexts/AuthProvider";
const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}
const root = createRoot(container);

Amplify.configure(amplifyconfig);
cognitoUserPoolsTokenProvider.setKeyValueStorage(new CookieStorage());
root.render(
  <React.StrictMode>
    <ClassPrefix prefix="bx">
      <ThemePreference>
        <Provider store={store}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </Provider>
      </ThemePreference>
    </ClassPrefix>
  </React.StrictMode>
);
