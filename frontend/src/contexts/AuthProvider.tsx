import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import { cognitoAuth } from '../services/CognitoAuthService';
import { parseToken, FamLoginUser, setAuthIdToken } from '../services/AuthService';
import { env } from '../env';
import { JWT, ProviderType } from '../types/amplify';

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

  const appEnv = env.VITE_ZONE ?? 'DEV';

  const refreshUserState = async () => {
    setIsLoading(true);
    try {
      const idToken = await loadUserToken();
      if (idToken) {
        setUser(parseToken(idToken));
      } else {
        setUser(undefined);
        setUserRoles(undefined);
      }
    } catch {
      setUser(undefined);
      setUserRoles(undefined);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Handle OAuth callback if present
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('code') || urlParams.get('error')) {
        await cognitoAuth.handleCallback();
        // Refresh user state after handling callback
        await refreshUserState();
      } else {
        // Normal initialization
        await refreshUserState();
      }
    };

    handleCallback();
    // Refresh tokens every 2-3 minutes (similar to Amplify's session manager)
    // This will automatically refresh tokens if they're expiring soon
    // Note: refreshUserState() internally calls loadUserToken(), so we don't need to call it separately
    const interval = setInterval(async () => {
      try {
        // refreshUserState() will:
        // 1. Call loadUserToken() which calls getTokens()
        // 2. getTokens() automatically refreshes if expiring soon
        // 3. Parse token and update user state
        await refreshUserState();
      } catch (error) {
        // Token refresh failed, user will need to re-login
        setUser(undefined);
        setUserRoles(undefined);
      }
    }, 2 * 60 * 1000); // Check every 2 minutes
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // refreshUserState is stable, no need to include in deps

  const login = useCallback(
    (provider: ProviderType) => {
      cognitoAuth.signInWithRedirect(provider);
    },
    [],
  );

  const logout = useCallback(() => {
    setUser(undefined);
    setUserRoles(undefined);
    cognitoAuth.signOut();
  }, []);

  const contextValue: AuthContextType = useMemo(
    () => ({
      user,
      userRoles,
      isLoggedIn: !!user,
      isLoading,
      login,
      logout,
    }),
    [user, userRoles, isLoading, login, logout],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// This is a helper hook to use the Auth context more easily
// 5. Create a custom hook to consume the context safely
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const loadUserToken = async (): Promise<JWT | undefined> => {
  if (env.NODE_ENV !== 'test') {
    const tokens = await cognitoAuth.getTokens();
    if (tokens?.idToken) {
      setAuthIdToken(tokens.idToken.toString() || null);
      return tokens.idToken;
    }
    return undefined;
  } else {
    // This is for test only
    const token = getUserTokenFromCookie();
    if (token) {
      const jwtBody = JSON.parse(atob(token.split('.')[1]));
      return { payload: jwtBody, toString: () => token };
    }
    throw new Error('No token found');
  }
};

const getUserTokenFromCookie = (): string | undefined => {
  const baseCookieName = `CognitoIdentityServiceProvider.${env.VITE_USER_POOLS_WEB_CLIENT_ID}`;
  const userId = encodeURIComponent(getCookie(`${baseCookieName}.LastAuthUser`));
  if (userId) {
    return getCookie(`${baseCookieName}.${userId}.idToken`);
  } else {
    return undefined;
  }
};

const getCookie = (name: string): string => {
  const cookie = document.cookie
    .split(';')
    .find((cookieValue) => cookieValue.trim().startsWith(name));
  return cookie ? cookie.split('=')[1] : '';
};
