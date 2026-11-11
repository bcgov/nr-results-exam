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

    userManager.events.addUserLoaded(onUserLoaded);
    userManager.events.addUserUnloaded(onUserCleared);
    userManager.events.addAccessTokenExpired(onUserCleared);
    userManager.events.addSilentRenewError(onUserCleared);

    return () => {
      userManager.events.removeUserLoaded(onUserLoaded);
      userManager.events.removeUserUnloaded(onUserCleared);
      userManager.events.removeAccessTokenExpired(onUserCleared);
      userManager.events.removeSilentRenewError(onUserCleared);
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
