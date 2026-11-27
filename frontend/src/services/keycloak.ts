import { UserManager, UserManagerSettings, WebStorageStateStore, User } from 'oidc-client-ts';
import { env } from '../env';

export type ProviderType = 'idir' | 'bceid';

/**
 * Creates the OIDC UserManager settings for BC Gov Keycloak SSO.
 * Derives redirect URIs from window.location.origin so a single build
 * serves local, dev, test, and prod environments.
 */
export function getOidcSettings(): UserManagerSettings {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const authority = env.VITE_KEYCLOAK_URL;
  const clientId = env.VITE_KEYCLOAK_CLIENT_ID;
  if (!authority || !clientId) {
    throw new Error(
      'Keycloak is not configured: VITE_KEYCLOAK_URL and VITE_KEYCLOAK_CLIENT_ID are required',
    );
  }

  return {
    authority,
    client_id: clientId,
    redirect_uri: `${origin}/authCallback`,
    post_logout_redirect_uri: origin,
    response_type: 'code',
    scope: 'openid profile email',
    loadUserInfo: false,
    automaticSilentRenew: true,
    userStore:
      typeof window !== 'undefined'
        ? new WebStorageStateStore({ store: window.sessionStorage })
        : undefined,
  };
}

let userManagerInstance: UserManager | null = null;

/**
 * Lazily gets or initializes the UserManager singleton.
 */
export function getUserManager(): UserManager {
  userManagerInstance ??= new UserManager(getOidcSettings());
  return userManagerInstance;
}

/**
 * Resets the UserManager singleton instance (used for testing).
 */
export function resetUserManager(): void {
  userManagerInstance = null;
}

/**
 * Initiates the Keycloak OIDC login redirect with the appropriate kc_idp_hint.
 * Note: Under Keycloak standard realm, the hint is constant ('azureidir' or 'bceidbusiness')
 * across all environments.
 */
export async function signinRedirect(provider: ProviderType): Promise<void> {
  const userManager = getUserManager();
  const idpHint = provider === 'bceid' ? 'bceidbusiness' : 'azureidir';
  await userManager.signinRedirect({
    extraQueryParams: {
      kc_idp_hint: idpHint,
    },
  });
}

/**
 * Initiates Keycloak logout redirect.
 * Critical: Does NOT remove the stored user before signoutRedirect,
 * ensuring id_token_hint is passed so Keycloak attributes the session.
 * Falls back to removeUser() and redirecting home if the network redirect fails.
 */
export async function signoutRedirect(): Promise<void> {
  const userManager = getUserManager();
  try {
    await userManager.signoutRedirect();
  } catch (error) {
    console.error('Signout redirect failed, falling back to local user removal:', error);
    await userManager.removeUser();
    if (typeof window !== 'undefined') {
      window.location.href = window.location.origin;
    }
  }
}

/**
 * Completes the code exchange on callback.
 */
export async function handleCallback(): Promise<User> {
  const userManager = getUserManager();
  return userManager.signinRedirectCallback();
}

/**
 * Retrieves the currently authenticated user from sessionStorage.
 */
export async function getCurrentUser(): Promise<User | null> {
  const userManager = getUserManager();
  return userManager.getUser();
}
