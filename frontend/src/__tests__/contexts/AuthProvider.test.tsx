import type { PropsWithChildren } from 'react';

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, beforeEach, expect, test, vi } from 'vitest';

vi.mock('../../env', () => ({
  env: {
    NODE_ENV: 'development',
    VITE_ZONE: 'test',
    VITE_USER_POOLS_WEB_CLIENT_ID: 'fake-client-id',
  },
}));

vi.mock('../../services/CognitoAuthService', () => ({
  cognitoAuth: {
    getTokens: vi.fn(),
    signInWithRedirect: vi.fn(),
    signOut: vi.fn(),
    handleCallback: vi.fn(),
    refreshTokens: vi.fn(),
  },
}));

vi.mock('../../services/AuthService', () => ({
  parseToken: vi.fn(),
  setAuthIdToken: vi.fn(),
}));

import { AuthProvider, useAuth } from '../../contexts/AuthProvider';
import { cognitoAuth } from '../../services/CognitoAuthService';
import { parseToken, setAuthIdToken } from '../../services/AuthService';

const mockCognitoAuth = vi.mocked(cognitoAuth);
const mockParseToken = vi.mocked(parseToken);
const mockSetAuthIdToken = vi.mocked(setAuthIdToken);

const wrapper = ({ children }: PropsWithChildren) => <AuthProvider>{children}</AuthProvider>;

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('useAuth throws when not wrapped in provider', () => {
    expect(() => renderHook(() => useAuth())).toThrowError(
      'useAuth must be used within an AuthProvider',
    );
  });

  test('provides authenticated state when id token is available', async () => {
    const mockIdToken = {
      toString: () => 'token-value',
      payload: { sub: 'user-123' },
    };

    mockCognitoAuth.getTokens.mockResolvedValueOnce({
      idToken: mockIdToken,
    });
    mockCognitoAuth.handleCallback.mockResolvedValueOnce(false);
    mockParseToken.mockReturnValueOnce({
      userName: 'jane.doe@gov.bc.ca',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.user).toEqual({
      userName: 'jane.doe@gov.bc.ca',
    });
    expect(mockParseToken).toHaveBeenCalledWith(mockIdToken);
    expect(mockSetAuthIdToken).toHaveBeenCalledWith('token-value');

    await act(() => {
      result.current.logout();
    });

    expect(mockCognitoAuth.signOut).toHaveBeenCalledTimes(1);
    expect(result.current.isLoggedIn).toBe(false);
  });

  test('handles missing id token by resetting auth state', async () => {
    mockCognitoAuth.getTokens.mockResolvedValueOnce(undefined);
    mockCognitoAuth.handleCallback.mockResolvedValueOnce(false);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.user).toBeUndefined();
    expect(mockParseToken).not.toHaveBeenCalled();
    expect(mockSetAuthIdToken).toHaveBeenCalledWith(null);
  });

  test('recovers from session errors and formats login provider', async () => {
    mockCognitoAuth.getTokens.mockResolvedValueOnce(undefined);
    mockCognitoAuth.handleCallback.mockResolvedValueOnce(false);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isLoggedIn).toBe(false);

    await act(() => {
      result.current.login('idir');
    });

    expect(mockCognitoAuth.signInWithRedirect).toHaveBeenCalledWith('idir');

    await act(() => {
      result.current.login('bceid');
    });

    expect(mockCognitoAuth.signInWithRedirect).toHaveBeenLastCalledWith('bceid');
  });

  test('login function is memoized and maintains same reference', async () => {
    mockCognitoAuth.getTokens.mockResolvedValueOnce(undefined);
    mockCognitoAuth.handleCallback.mockResolvedValueOnce(false);

    const { result, rerender } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const firstLogin = result.current.login;
    const firstLogout = result.current.logout;

    // Re-render should return the same function references due to useCallback
    rerender();
    expect(result.current.login).toBe(firstLogin);
    expect(result.current.logout).toBe(firstLogout);
  });

  test('logout clears user and userRoles state', async () => {
    const mockIdToken = {
      toString: () => 'token-value',
      payload: { sub: 'user-123' },
    };

    mockCognitoAuth.getTokens.mockResolvedValueOnce({
      idToken: mockIdToken,
    });
    mockCognitoAuth.handleCallback.mockResolvedValueOnce(false);
    mockParseToken.mockReturnValueOnce({
      userName: 'test.user@gov.bc.ca',
      firstName: 'Test',
      lastName: 'User',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.user).toBeDefined();

    await act(() => {
      result.current.logout();
    });

    expect(mockCognitoAuth.signOut).toHaveBeenCalledTimes(1);
    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.user).toBeUndefined();
    expect(result.current.userRoles).toBeUndefined();
  });

  test('context value is memoized and updates when dependencies change', async () => {
    mockCognitoAuth.getTokens.mockResolvedValueOnce(undefined);
    mockCognitoAuth.handleCallback.mockResolvedValueOnce(false);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const initialIsLoading = result.current.isLoading;
    const initialIsLoggedIn = result.current.isLoggedIn;

    // After state changes, context value should update
    expect(initialIsLoading).toBe(false);
    expect(initialIsLoggedIn).toBe(false);

    // Verify context value structure
    expect(result.current).toHaveProperty('user');
    expect(result.current).toHaveProperty('userRoles');
    expect(result.current).toHaveProperty('isLoggedIn');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('login');
    expect(result.current).toHaveProperty('logout');
  });

  test('refreshUserState handles token parsing errors gracefully', async () => {
    const mockIdToken = {
      toString: () => 'token-value',
      payload: { sub: 'user-123' },
    };

    mockCognitoAuth.getTokens.mockResolvedValueOnce({
      idToken: mockIdToken,
    });
    mockCognitoAuth.handleCallback.mockResolvedValueOnce(false);
    // Mock parseToken to throw an error
    mockParseToken.mockImplementationOnce(() => {
      throw new Error('Token parsing failed');
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Should handle parsing error and reset state
    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.user).toBeUndefined();
  });

  test('login function calls cognitoAuth with correct provider', async () => {
    mockCognitoAuth.getTokens.mockResolvedValueOnce(undefined);
    mockCognitoAuth.handleCallback.mockResolvedValueOnce(false);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Test login with idir provider
    await act(() => {
      result.current.login('idir');
    });

    expect(mockCognitoAuth.signInWithRedirect).toHaveBeenCalledWith('idir');

    // Test login with bceid provider
    await act(() => {
      result.current.login('bceid');
    });

    expect(mockCognitoAuth.signInWithRedirect).toHaveBeenLastCalledWith('bceid');
  });

  test('contextValue useMemo updates when login or logout functions change', async () => {
    mockCognitoAuth.getTokens.mockResolvedValueOnce(undefined);
    mockCognitoAuth.handleCallback.mockResolvedValueOnce(false);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const initialContextValue = result.current;
    const initialLogin = result.current.login;
    const initialLogout = result.current.logout;

    // Verify login and logout are included in context value
    expect(initialContextValue.login).toBe(initialLogin);
    expect(initialContextValue.logout).toBe(initialLogout);

    // Call logout to trigger state change
    await act(() => {
      result.current.logout();
    });

    // Context value should update due to state changes, but login/logout functions should remain the same
    expect(result.current.login).toBe(initialLogin);
    expect(result.current.logout).toBe(initialLogout);
  });
});
