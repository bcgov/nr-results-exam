import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  ReactNode
} from "react";
import {
  fetchAuthSession,
  signInWithRedirect,
  signOut
} from "aws-amplify/auth";
import {
  parseToken,
  FamLoginUser,
  setAuthIdToken
} from "../services/AuthService";
import { env } from "../env";
import { JWT, ProviderType } from "../types/amplify";

// 1. Define an interface for the context value
interface AuthContextType {
  user: FamLoginUser | undefined;
  userRoles: string[] | undefined;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (provider: ProviderType) => void;
  logout: () => void;
}

// 2. Define an interface for the provider's props
interface AuthProviderProps {
  children: ReactNode;
}

// 3. Create the context with a default value of `undefined`
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 4. Create the AuthProvider component with explicit typing
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<FamLoginUser | undefined>(undefined);
  const [userRoles, setUserRoles] = useState<string[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const appEnv = env.VITE_ZONE ?? "DEV";

  const refreshUserState = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const idToken = await loadUserToken();
      if (idToken) {
        setUser(parseToken(idToken));
        return true; // Success
      } else {
        setUser(undefined);
        setUserRoles(undefined);
        return false;
      }
    } catch (error) {
      console.error('Failed to refresh user state:', error);
      setUser(undefined);
      setUserRoles(undefined);
      return false; // Failed
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check if we're in an OAuth callback (URL contains authorization code)
    const urlParams = new URLSearchParams(window.location.search);
    const isOAuthCallback = urlParams.has('code') || urlParams.has('state');
    
    // Log OAuth callback details for debugging
    if (isOAuthCallback) {
      console.log('OAuth callback detected:', {
        currentUrl: window.location.href,
        origin: window.location.origin,
        expectedRedirectUri: `${window.location.origin}/dashboard`,
        hasCode: urlParams.has('code'),
        hasState: urlParams.has('state'),
        code: urlParams.get('code')?.substring(0, 20) + '...' // Log first 20 chars only
      });
    }
    
    // If we're in an OAuth callback, refresh user state immediately
    // This ensures fetchAuthSession() processes the callback and exchanges the code for tokens
    if (isOAuthCallback) {
      refreshUserState().then((success) => {
        // Only clean up the URL if token exchange was successful
        // Amplify needs the code/state parameters to complete the exchange
        if (success) {
          // Clean up the URL by removing OAuth parameters after successful processing
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('code');
          newUrl.searchParams.delete('state');
          window.history.replaceState({}, '', newUrl.toString());
        } else {
          console.error('Token exchange failed - check Cognito redirect URI configuration');
          console.error('Expected redirect URI:', `${window.location.origin}/dashboard`);
        }
      }).catch((error) => {
        // Log error but don't clean up URL params if exchange failed
        // This allows retry or better error diagnosis
        console.error('OAuth callback processing failed:', error);
      });
    } else {
      refreshUserState();
    }
    
    const interval = setInterval(loadUserToken, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshUserState]);

  const login = async (provider: ProviderType) => {
    const envProvider =
      provider.localeCompare("idir") === 0
        ? `${appEnv.toLocaleUpperCase()}-IDIR`
        : `${appEnv.toLocaleUpperCase()}-BCEIDBUSINESS`;

    signInWithRedirect({
      provider: { custom: envProvider.toUpperCase() }
    });
  };

  const logout = async () => {
    await signOut();
    setUser(undefined);
    setUserRoles(undefined);
  };

  const contextValue: AuthContextType = useMemo(
    () => ({
      user,
      userRoles,
      isLoggedIn: !!user,
      isLoading,
      login,
      logout
    }),
    [user, userRoles, isLoading]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// This is a helper hook to use the Auth context more easily
// 5. Create a custom hook to consume the context safely
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const loadUserToken = async (): Promise<JWT | undefined> => {
  if (env.NODE_ENV !== "test") {
    try {
      const session = await fetchAuthSession();
      const { idToken } = session.tokens ?? {};
      setAuthIdToken(idToken?.toString() || null);
      return idToken;
    } catch (error: any) {
      // Log detailed error information for debugging
      console.error('fetchAuthSession error:', {
        message: error?.message,
        name: error?.name,
        cause: error?.cause,
        stack: error?.stack,
        // Check if it's a network error with response details
        response: error?.response || error?.$metadata || error?.underlyingError
      });
      
      // If there's a response body, try to extract the error message
      if (error?.response || error?.underlyingError) {
        const responseError = error.response || error.underlyingError;
        console.error('Cognito error details:', {
          status: responseError.status,
          statusText: responseError.statusText,
          data: responseError.data || responseError.body
        });
      }
      
      throw error;
    }
  } else {
    // This is for test only
    const token = getUserTokenFromCookie();
    if (token) {
      const jwtBody = JSON.parse(atob(token.split(".")[1]));
      return { payload: jwtBody };
    }
    throw new Error("No token found");
  }
};

const getUserTokenFromCookie = (): string | undefined => {
  const baseCookieName = `CognitoIdentityServiceProvider.${env.VITE_USER_POOLS_WEB_CLIENT_ID}`;
  const userId = encodeURIComponent(
    getCookie(`${baseCookieName}.LastAuthUser`)
  );
  if (userId) {
    return getCookie(`${baseCookieName}.${userId}.idToken`);
  } else {
    return undefined;
  }
};

const getCookie = (name: string): string => {
  const cookie = document.cookie
    .split(";")
    .find((cookieValue) => cookieValue.trim().startsWith(name));
  return cookie ? cookie.split("=")[1] : "";
};
