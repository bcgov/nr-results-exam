import { describe, beforeEach, expect, test } from 'vitest';
import {
  parseToken,
  normalizeIdpProvider,
  setAuthIdToken,
  getAuthIdToken,
} from '../../services/AuthService';

describe('AuthService', () => {
  beforeEach(() => {
    setAuthIdToken(null);
  });

  test('normalizeIdpProvider maps azureidir and idir to IDIR', () => {
    expect(normalizeIdpProvider('azureidir')).toBe('IDIR');
    expect(normalizeIdpProvider('AZUREIDIR')).toBe('IDIR');
    expect(normalizeIdpProvider('idir')).toBe('IDIR');
    expect(normalizeIdpProvider('IDIR')).toBe('IDIR');
  });

  test('normalizeIdpProvider maps bceidbusiness variants to BCEIDBUSINESS', () => {
    expect(normalizeIdpProvider('bceidbusiness')).toBe('BCEIDBUSINESS');
    expect(normalizeIdpProvider('bceid')).toBe('BCEIDBUSINESS');
  });

  test('parseToken extracts Keycloak IDIR claims, normalizes azureidir, and preserves username case', () => {
    const oidcUser = {
      access_token: 'access-token-123',
      profile: {
        identity_provider: 'azureidir',
        idir_username: 'JSmith',
        display_name: 'Smith, John M',
        email: 'john.smith@gov.bc.ca',
        client_roles: ['RESULTS_USER', 'FAM:EXPIRES:2026-12-31:RESULTS_USER'],
        exp: 1700000000,
      },
    };

    const user = parseToken(oidcUser);

    expect(user).toEqual({
      userName: 'JSmith',
      displayName: 'Smith, John M',
      email: 'john.smith@gov.bc.ca',
      idpProvider: 'IDIR',
      firstName: 'John',
      lastName: 'Smith',
      providerUsername: 'IDIR\\JSmith',
      roles: ['RESULTS_USER'],
      authToken: 'access-token-123',
      exp: 1700000000,
    });
    expect(getAuthIdToken()).toBe('access-token-123');
  });

  test('parseToken extracts given_name and family_name when present', () => {
    const oidcUser = {
      access_token: 'access-token-456',
      profile: {
        identity_provider: 'bceidbusiness',
        bceid_username: 'bizuser',
        display_name: 'Biz User',
        given_name: 'Biz',
        family_name: 'User',
        email: 'biz@example.com',
      },
    };

    const user = parseToken(oidcUser);

    expect(user?.idpProvider).toBe('BCEIDBUSINESS');
    expect(user?.userName).toBe('bizuser');
    expect(user?.firstName).toBe('Biz');
    expect(user?.lastName).toBe('User');
    expect(user?.providerUsername).toBe('BCEIDBUSINESS\\bizuser');
  });

  test('parseToken returns undefined for null/undefined input', () => {
    expect(parseToken(undefined)).toBeUndefined();
    expect(parseToken(null)).toBeUndefined();
  });
});
