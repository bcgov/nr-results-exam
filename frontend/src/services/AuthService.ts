import type { User } from 'oidc-client-ts';

// Global storage for the active access token
let authIdToken: string | null = null;

export interface FamLoginUser {
  providerUsername?: string;
  userName?: string;
  displayName?: string;
  email?: string;
  idpProvider?: string;
  roles?: string[];
  authToken?: string;
  exp?: number;
  firstName?: string;
  lastName?: string;
}

/**
 * Sets the active bearer auth token.
 */
export const setAuthIdToken = (token: string | null): void => {
  authIdToken = token;
};

/**
 * Retrieves the active bearer auth token.
 */
export const getAuthIdToken = (): string | null => {
  return authIdToken;
};

/**
 * Normalizes identity provider aliases.
 * Keycloak standard realm IDIR-MFA emits 'azureidir', which must be normalized
 * to 'IDIR' to match existing user identity records.
 */
export const normalizeIdpProvider = (provider?: string): string => {
  if (!provider) return '';
  const upper = provider.toUpperCase();
  if (upper === 'AZUREIDIR' || upper === 'IDIR') {
    return 'IDIR';
  }
  if (upper === 'BCEIDBUSINESS' || upper === 'BCEID_BUSINESS' || upper.startsWith('BCEID')) {
    return 'BCEIDBUSINESS';
  }
  return upper;
};

type TokenSource =
  | User
  | { profile: Record<string, unknown>; access_token?: string; id_token?: string }
  | { payload: Record<string, unknown>; toString?: () => string }
  | Record<string, unknown>;

/**
 * Parses user identity and profile claims from an OIDC User or JWT payload.
 */
export const parseToken = (source: TokenSource | null | undefined): FamLoginUser | undefined => {
  if (!source) return undefined;

  let profile: Record<string, unknown>;
  let tokenStr: string | null = null;

  if ('profile' in source && source.profile) {
    profile = source.profile as Record<string, unknown>;
    const access =
      'access_token' in source && typeof source.access_token === 'string'
        ? source.access_token
        : undefined;
    const id =
      'id_token' in source && typeof source.id_token === 'string' ? source.id_token : undefined;
    tokenStr = access || id || null;
  } else if ('payload' in source && source.payload) {
    profile = source.payload as Record<string, unknown>;
    tokenStr = typeof source.toString === 'function' ? source.toString() : null;
  } else {
    profile = source as Record<string, unknown>;
  }

  if (tokenStr) {
    setAuthIdToken(tokenStr);
  }

  const rawProvider = profile.identity_provider as string;
  const idpProvider = normalizeIdpProvider(rawProvider);

  const displayName = (profile.display_name as string) || (profile.name as string) || '';

  let firstName = (profile.given_name as string) || '';
  let lastName = (profile.family_name as string) || '';

  if (!firstName && !lastName && displayName) {
    const hasComma = displayName.includes(',');
    let parsedFirst: string | undefined;
    let parsedLast: string | undefined;

    if (hasComma) {
      [parsedLast, parsedFirst] = displayName.split(', ');
    } else {
      [parsedFirst, parsedLast] = displayName.split(' ');
    }

    lastName = parsedLast || '';
    firstName = parsedFirst ? parsedFirst.split(' ')[0].trim() : '';
  }

  // Preserve username in exact casing issued
  const userName =
    (profile.idir_username as string) ||
    (profile.bceid_username as string) ||
    (profile.preferred_username as string) ||
    '';

  const email = (profile.email as string) || '';

  // Extract roles from client_roles or roles, filtering out FAM: bookkeeping roles
  const rawRoles = Array.isArray(profile.client_roles)
    ? (profile.client_roles as string[])
    : Array.isArray(profile.roles)
      ? (profile.roles as string[])
      : [];
  const roles = rawRoles.filter((r) => typeof r === 'string' && !r.startsWith('FAM:'));

  const exp = typeof profile.exp === 'number' ? profile.exp : undefined;

  return {
    userName,
    displayName,
    email,
    idpProvider,
    firstName,
    lastName,
    providerUsername: idpProvider && userName ? `${idpProvider}\\${userName}` : userName,
    roles,
    authToken: tokenStr || undefined,
    exp,
  };
};
