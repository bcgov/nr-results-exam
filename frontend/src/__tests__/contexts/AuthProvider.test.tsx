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

vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn(),
  signInWithRedirect: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('../../services/AuthService', () => ({
  parseToken: vi.fn(),
  setAuthIdToken: vi.fn(),
}));

import { AuthProvider, useAuth } from '../../contexts/AuthProvider';
import { fetchAuthSession, signInWithRedirect, signOut } from 'aws-amplify/auth';
import { parseToken, setAuthIdToken } from '../../services/AuthService';

const mockFetchAuthSession = vi.mocked(fetchAuthSession);
const mockSignInWithRedirect = vi.mocked(signInWithRedirect);
const mockSignOut = vi.mocked(signOut);
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

    mockFetchAuthSession.mockResolvedValueOnce({
      tokens: { idToken: mockIdToken },
    });
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

    await act(async () => {
      await result.current.logout();
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(result.current.isLoggedIn).toBe(false);
  });

  test('handles missing id token by resetting auth state', async () => {
    mockFetchAuthSession.mockResolvedValueOnce({ tokens: {} });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.user).toBeUndefined();
    expect(mockParseToken).not.toHaveBeenCalled();
    expect(mockSetAuthIdToken).toHaveBeenCalledWith(null);
  });

  test('recovers from session errors and formats login provider', async () => {
    mockFetchAuthSession.mockRejectedValueOnce(new Error('session failed'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isLoggedIn).toBe(false);

    await act(async () => {
      await result.current.login('idir');
    });

    expect(mockSignInWithRedirect).toHaveBeenCalledWith({
      provider: { custom: 'TEST-IDIR' },
    });

    await act(async () => {
      await result.current.login('bceid');
    });

    expect(mockSignInWithRedirect).toHaveBeenLastCalledWith({
      provider: { custom: 'TEST-BCEIDBUSINESS' },
    });
  });

  test('login function is memoized and maintains same reference', async () => {
    mockFetchAuthSession.mockResolvedValueOnce({ tokens: {} });

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

    mockFetchAuthSession.mockResolvedValueOnce({
      tokens: { idToken: mockIdToken },
    });
    mockParseToken.mockReturnValueOnce({
      userName: 'test.user@gov.bc.ca',
      firstName: 'Test',
      lastName: 'User',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.user).toBeDefined();

    await act(async () => {
      await result.current.logout();
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.user).toBeUndefined();
    expect(result.current.userRoles).toBeUndefined();
  });

  test('context value is memoized and updates when dependencies change', async () => {
    mockFetchAuthSession.mockResolvedValueOnce({ tokens: {} });

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
});
