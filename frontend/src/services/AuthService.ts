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
  | Record<string, unknown>;

const readString = (obj: Record<string, unknown>, key: string): string => {
  const val = obj[key];
  return typeof val === 'string' ? val : '';
};

const extractProfileAndToken = (
  source: TokenSource,
): { profile: Record<string, unknown>; tokenStr: string | null } => {
  if ('profile' in source && source.profile) {
    const record = source as Record<string, unknown>;
    const tokenStr = readString(record, 'access_token') || readString(record, 'id_token') || null;
    return { profile: source.profile as Record<string, unknown>, tokenStr };
  }

  return { profile: source as Record<string, unknown>, tokenStr: null };
};

const extractNames = (
  profile: Record<string, unknown>,
  displayName: string,
): { firstName: string; lastName: string } => {
  const givenName = readString(profile, 'given_name');
  const familyName = readString(profile, 'family_name');

  if (givenName || familyName || !displayName) {
    return { firstName: givenName, lastName: familyName };
  }

  const [parsedFirst, parsedLast] = displayName.includes(',')
    ? displayName.split(', ').reverse()
    : displayName.split(' ');

  return {
    firstName: parsedFirst ? parsedFirst.split(' ')[0].trim() : '',
    lastName: parsedLast || '',
  };
};

const extractRoles = (profile: Record<string, unknown>): string[] => {
  let rawRoles: unknown[] = [];
  if (Array.isArray(profile.client_roles)) {
    rawRoles = profile.client_roles;
  } else if (Array.isArray(profile.roles)) {
    rawRoles = profile.roles;
  }
  return rawRoles.filter((r): r is string => typeof r === 'string' && !r.startsWith('FAM:'));
};

/**
 * Parses user identity and profile claims from an OIDC User or JWT payload.
 */
export const parseToken = (source: TokenSource | null | undefined): FamLoginUser | undefined => {
  if (!source) return undefined;

  const { profile, tokenStr } = extractProfileAndToken(source);
  if (tokenStr) {
    setAuthIdToken(tokenStr);
  }

  const idpProvider = normalizeIdpProvider(readString(profile, 'identity_provider'));
  const displayName = readString(profile, 'display_name') || readString(profile, 'name');
  const { firstName, lastName } = extractNames(profile, displayName);

  // Preserve username in exact casing issued
  const userName =
    readString(profile, 'idir_username') ||
    readString(profile, 'bceid_username') ||
    readString(profile, 'preferred_username');

  const email = readString(profile, 'email');
  const roles = extractRoles(profile);
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
