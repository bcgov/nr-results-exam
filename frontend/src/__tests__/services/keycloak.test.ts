import { describe, beforeEach, afterEach, expect, test, vi } from 'vitest';

const mockSigninRedirect = vi.fn();
const mockSignoutRedirect = vi.fn();
const mockSigninRedirectCallback = vi.fn();
const mockGetUser = vi.fn();
const mockRemoveUser = vi.fn();

vi.mock('oidc-client-ts', () => {
  return {
    UserManager: vi.fn().mockImplementation(function (settings) {
      return {
        settings,
        signinRedirect: mockSigninRedirect,
        signoutRedirect: mockSignoutRedirect,
        signinRedirectCallback: mockSigninRedirectCallback,
        getUser: mockGetUser,
        removeUser: mockRemoveUser,
        events: {
          addUserLoaded: vi.fn(),
          removeUserLoaded: vi.fn(),
          addUserUnloaded: vi.fn(),
          removeUserUnloaded: vi.fn(),
          addAccessTokenExpired: vi.fn(),
          removeAccessTokenExpired: vi.fn(),
          addSilentRenewError: vi.fn(),
          removeSilentRenewError: vi.fn(),
        },
      };
    }),
    WebStorageStateStore: vi.fn().mockImplementation(function () {
      return {};
    }),
  };
});

vi.mock('../../env', () => ({
  env: {
    VITE_KEYCLOAK_URL: 'https://test.loginproxy.gov.bc.ca/auth/realms/standard',
    VITE_KEYCLOAK_CLIENT_ID: 'my-client-app',
  },
}));

import {
  getOidcSettings,
  getUserManager,
  resetUserManager,
  signinRedirect,
  signoutRedirect,
  handleCallback,
  getCurrentUser,
} from '../../services/keycloak';

describe('keycloak OIDC service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetUserManager();
  });

  afterEach(() => {
    resetUserManager();
  });

  test('getOidcSettings configures PKCE, scope, and sessionStorage', () => {
    const settings = getOidcSettings();

    expect(settings.authority).toBe('https://test.loginproxy.gov.bc.ca/auth/realms/standard');
    expect(settings.client_id).toBe('my-client-app');
    expect(settings.response_type).toBe('code');
    expect(settings.scope).toBe('openid profile email');
    expect(settings.automaticSilentRenew).toBe(true);
    expect(settings.loadUserInfo).toBe(false);
    expect(settings.redirect_uri).toContain('/authCallback');
  });

  test('getUserManager returns UserManager singleton instance', () => {
    const manager1 = getUserManager();
    const manager2 = getUserManager();

    expect(manager1).toBe(manager2);
  });

  test('signinRedirect sets kc_idp_hint to azureidir for idir', async () => {
    await signinRedirect('idir');

    expect(mockSigninRedirect).toHaveBeenCalledWith({
      extraQueryParams: {
        kc_idp_hint: 'azureidir',
      },
    });
  });

  test('signinRedirect sets kc_idp_hint to bceidbusiness for bceid', async () => {
    await signinRedirect('bceid');

    expect(mockSigninRedirect).toHaveBeenCalledWith({
      extraQueryParams: {
        kc_idp_hint: 'bceidbusiness',
      },
    });
  });

  test('signoutRedirect delegates to userManager without clearing user first', async () => {
    mockSignoutRedirect.mockResolvedValueOnce(undefined);

    await signoutRedirect();

    expect(mockSignoutRedirect).toHaveBeenCalledTimes(1);
    expect(mockRemoveUser).not.toHaveBeenCalled();
  });

  test('signoutRedirect falls back to removeUser when network redirect fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSignoutRedirect.mockRejectedValueOnce(new Error('Network error'));
    mockRemoveUser.mockResolvedValueOnce(undefined);

    await signoutRedirect();

    expect(mockSignoutRedirect).toHaveBeenCalledTimes(1);
    expect(mockRemoveUser).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test('handleCallback delegates to signinRedirectCallback', async () => {
    const mockUser = { access_token: 'abc' } as any;
    mockSigninRedirectCallback.mockResolvedValueOnce(mockUser);

    const user = await handleCallback();

    expect(mockSigninRedirectCallback).toHaveBeenCalledTimes(1);
    expect(user).toBe(mockUser);
  });

  test('getCurrentUser delegates to getUser', async () => {
    const mockUser = { access_token: 'abc' } as any;
    mockGetUser.mockResolvedValueOnce(mockUser);

    const user = await getCurrentUser();

    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(user).toBe(mockUser);
  });
});
