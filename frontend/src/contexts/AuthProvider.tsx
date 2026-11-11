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

  const refreshUserState = useCallback(async () => {
    setIsLoading(true);
    try {
      const oidcUser = await getCurrentUser();
      if (oidcUser && !oidcUser.expired) {
        const parsed = parseToken(oidcUser);
        setUser(parsed);
        setUserRoles(parsed?.roles);
      } else {
        setUser(undefined);
        setUserRoles(undefined);
        setAuthIdToken(null);
      }
    } catch {
      setUser(undefined);
      setUserRoles(undefined);
      setAuthIdToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load
    refreshUserState();

    const userManager = getUserManager();

    const onUserLoaded = (loadedUser: import('oidc-client-ts').User) => {
      const parsed = parseToken(loadedUser);
      setUser(parsed);
      setUserRoles(parsed?.roles);
      setIsLoading(false);
    };

    const onUserUnloaded = () => {
      setUser(undefined);
      setUserRoles(undefined);
      setAuthIdToken(null);
      setIsLoading(false);
    };

    const onSilentRenewError = () => {
      setUser(undefined);
      setUserRoles(undefined);
      setAuthIdToken(null);
      setIsLoading(false);
    };

    userManager.events.addUserLoaded(onUserLoaded);
    userManager.events.addUserUnloaded(onUserUnloaded);
    userManager.events.addAccessTokenExpired(onUserUnloaded);
    userManager.events.addSilentRenewError(onSilentRenewError);

    return () => {
      userManager.events.removeUserLoaded(onUserLoaded);
      userManager.events.removeUserUnloaded(onUserUnloaded);
      userManager.events.removeAccessTokenExpired(onUserUnloaded);
      userManager.events.removeSilentRenewError(onSilentRenewError);
    };
  }, [refreshUserState]);

  const login = useCallback((provider: ProviderType) => {
    signinRedirect(provider);
  }, []);

  const logout = useCallback(() => {
    setUser(undefined);
    setUserRoles(undefined);
    setAuthIdToken(null);
    signoutRedirect();
  }, []);

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
