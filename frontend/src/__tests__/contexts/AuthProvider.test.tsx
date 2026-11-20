import type { PropsWithChildren } from 'react';

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, beforeEach, expect, test, vi } from 'vitest';

vi.mock('../../env', () => ({
  env: {
    NODE_ENV: 'development',
    VITE_ZONE: 'test',
    VITE_KEYCLOAK_CLIENT_ID: 'fake-client-id',
    VITE_KEYCLOAK_URL: 'https://dev.loginproxy.gov.bc.ca/auth/realms/standard',
  },
}));

const mockEvents = {
  addUserLoaded: vi.fn(),
  removeUserLoaded: vi.fn(),
  addUserUnloaded: vi.fn(),
  removeUserUnloaded: vi.fn(),
  addAccessTokenExpired: vi.fn(),
  removeAccessTokenExpired: vi.fn(),
  addSilentRenewError: vi.fn(),
  removeSilentRenewError: vi.fn(),
};

vi.mock('../../services/keycloak', () => ({
  getCurrentUser: vi.fn(),
  signinRedirect: vi.fn(),
  signoutRedirect: vi.fn(),
  getUserManager: vi.fn(() => ({
    events: mockEvents,
  })),
}));

vi.mock('../../services/AuthService', () => ({
  parseToken: vi.fn(),
  setAuthIdToken: vi.fn(),
}));

import { AuthProvider, useAuth } from '../../contexts/AuthProvider';
import { getCurrentUser, signinRedirect, signoutRedirect } from '../../services/keycloak';
import { parseToken, setAuthIdToken } from '../../services/AuthService';

const mockGetCurrentUser = vi.mocked(getCurrentUser);
const mockSigninRedirect = vi.mocked(signinRedirect);
const mockSignoutRedirect = vi.mocked(signoutRedirect);
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

  test('provides authenticated state when user is available', async () => {
    const mockUser = {
      profile: { sub: 'user-123', idir_username: 'jane.doe' },
      access_token: 'valid-access-token',
      expired: false,
    } as any;

    mockGetCurrentUser.mockResolvedValueOnce(mockUser);
    mockParseToken.mockReturnValueOnce({
      userName: 'jane.doe',
      displayName: 'Jane Doe',
      idpProvider: 'IDIR',
      roles: ['RESULTS_USER'],
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.user).toEqual({
      userName: 'jane.doe',
      displayName: 'Jane Doe',
      idpProvider: 'IDIR',
      roles: ['RESULTS_USER'],
    });
    expect(result.current.userRoles).toEqual(['RESULTS_USER']);
    expect(mockParseToken).toHaveBeenCalledWith(mockUser);

    await act(() => {
      result.current.logout();
    });

    expect(mockSignoutRedirect).toHaveBeenCalledTimes(1);
    expect(mockSetAuthIdToken).toHaveBeenCalledWith(null);
    expect(result.current.isLoggedIn).toBe(false);
  });

  test('handles missing or expired user by resetting auth state', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.user).toBeUndefined();
    expect(mockParseToken).not.toHaveBeenCalled();
    expect(mockSetAuthIdToken).toHaveBeenCalledWith(null);
  });

  test('login calls signinRedirect with provider hint', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(() => {
      result.current.login('idir');
    });

    expect(mockSigninRedirect).toHaveBeenCalledWith('idir');

    await act(() => {
      result.current.login('bceid');
    });

    expect(mockSigninRedirect).toHaveBeenLastCalledWith('bceid');
  });

  test('login and logout functions maintain stable references', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null);

    const { result, rerender } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const firstLogin = result.current.login;
    const firstLogout = result.current.logout;

    rerender();
    expect(result.current.login).toBe(firstLogin);
    expect(result.current.logout).toBe(firstLogout);
  });

  test('refreshUserState handles errors gracefully', async () => {
    mockGetCurrentUser.mockRejectedValueOnce(new Error('Storage failure'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.user).toBeUndefined();
    expect(mockSetAuthIdToken).toHaveBeenCalledWith(null);
  });

  test('subscribes to userManager loaded and cleared events and cleans up on unmount', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null);

    const { result, unmount } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isLoggedIn).toBe(false);

    const onUserLoaded = mockEvents.addUserLoaded.mock.calls[0]?.[0] as (u: any) => void;
    const onUserCleared = mockEvents.addUserUnloaded.mock.calls[0]?.[0] as () => void;
    const onSilentRenewError = mockEvents.addSilentRenewError.mock.calls[0]?.[0] as (
      err: unknown,
    ) => void;

    const refreshedUser = {
      profile: { idir_username: 'refreshed.user' },
      access_token: 'refreshed-token',
      expired: false,
    } as any;

    mockParseToken.mockReturnValueOnce({
      userName: 'refreshed.user',
      displayName: 'Refreshed User',
      idpProvider: 'IDIR',
      roles: ['ADMIN'],
    });

    act(() => {
      onUserLoaded(refreshedUser);
    });

    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.userRoles).toEqual(['ADMIN']);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Recoverable renewal timeout preserves active session
    act(() => {
      onSilentRenewError(new Error('Frame window timed out'));
    });

    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.user?.userName).toBe('refreshed.user');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();

    // Terminal OAuth renewal error clears session immediately
    act(() => {
      onSilentRenewError({ error: 'login_required' });
    });

    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.user).toBeUndefined();

    // Re-load then test userUnloaded cleanup
    mockParseToken.mockReturnValueOnce({
      userName: 'refreshed.user',
      displayName: 'Refreshed User',
      idpProvider: 'IDIR',
      roles: ['ADMIN'],
    });
    act(() => {
      onUserLoaded(refreshedUser);
    });
    expect(result.current.isLoggedIn).toBe(true);

    act(() => {
      onUserCleared();
    });

    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.user).toBeUndefined();
    expect(mockSetAuthIdToken).toHaveBeenCalledWith(null);

    unmount();

    expect(mockEvents.removeUserLoaded).toHaveBeenCalledWith(onUserLoaded);
    expect(mockEvents.removeUserUnloaded).toHaveBeenCalledWith(onUserCleared);
    expect(mockEvents.removeAccessTokenExpired).toHaveBeenCalledWith(onUserCleared);
    expect(mockEvents.removeSilentRenewError).toHaveBeenCalledWith(onSilentRenewError);
  });
});
