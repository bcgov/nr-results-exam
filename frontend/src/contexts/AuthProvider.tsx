import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import {
  getUserManager,
  getCurrentUser,
  signinRedirect,
  signoutRedirect,
  ProviderType,
} from '../services/keycloak';
import { parseToken, FamLoginUser, setAuthIdToken } from '../services/AuthService';

export interface AuthContextType {
  user: FamLoginUser | undefined;
  userRoles: string[] | undefined;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (provider: ProviderType) => void;
  logout: () => void;
  refreshUserState?: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const TERMINAL_RENEW_ERRORS = new Set([
  'login_required',
  'interaction_required',
  'consent_required',
  'invalid_grant',
  'session_not_active',
  'account_selection_required',
]);

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<FamLoginUser | undefined>(undefined);
  const [userRoles, setUserRoles] = useState<string[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const clearUser = useCallback(() => {
    setUser(undefined);
    setUserRoles(undefined);
    setAuthIdToken(null);
  }, []);

  const refreshUserState = useCallback(async () => {
    setIsLoading(true);
    try {
      const oidcUser = await getCurrentUser();
      if (oidcUser && !oidcUser.expired) {
        const parsed = parseToken(oidcUser);
        setUser(parsed);
        setUserRoles(parsed?.roles);
      } else {
        clearUser();
      }
    } catch {
      clearUser();
    } finally {
      setIsLoading(false);
    }
  }, [clearUser]);

  useEffect(() => {
    // Initial load
    void refreshUserState();

    const userManager = getUserManager();

    const onUserLoaded = (loadedUser: import('oidc-client-ts').User) => {
      const parsed = parseToken(loadedUser);
      setUser(parsed);
      setUserRoles(parsed?.roles);
      setIsLoading(false);
    };

    const onUserCleared = () => {
      clearUser();
      setIsLoading(false);
    };

    const onSilentRenewError = (error: unknown) => {
      const oauthError =
        typeof error === 'object' && error !== null && 'error' in error
          ? (error as { error?: unknown }).error
          : undefined;

      if (typeof oauthError === 'string' && TERMINAL_RENEW_ERRORS.has(oauthError)) {
        onUserCleared();
        return;
      }

      // Preserve active session on transient renewal timeouts until token expiry fires
      console.warn('Silent token renewal failed; preserving active session until expiry:', error);
    };

    userManager.events.addUserLoaded(onUserLoaded);
    userManager.events.addUserUnloaded(onUserCleared);
    userManager.events.addAccessTokenExpired(onUserCleared);
    userManager.events.addSilentRenewError(onSilentRenewError);

    return () => {
      userManager.events.removeUserLoaded(onUserLoaded);
      userManager.events.removeUserUnloaded(onUserCleared);
      userManager.events.removeAccessTokenExpired(onUserCleared);
      userManager.events.removeSilentRenewError(onSilentRenewError);
    };
  }, [refreshUserState, clearUser]);

  const login = useCallback((provider: ProviderType) => {
    void signinRedirect(provider);
  }, []);

  const logout = useCallback(() => {
    clearUser();
    void signoutRedirect();
  }, [clearUser]);

  const contextValue: AuthContextType = useMemo(
    () => ({
      user,
      userRoles,
      isLoggedIn: !!user,
      isLoading,
      login,
      logout,
      refreshUserState,
    }),
    [user, userRoles, isLoading, login, logout, refreshUserState],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
