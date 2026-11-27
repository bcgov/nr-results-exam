import { beforeEach, describe, expect, test, vi } from 'vitest';

describe('env runtime configuration extraction', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '';
  });

  test('merges data attributes into env when values are present', async () => {
    document.body.innerHTML = `
      <div
        id="root"
        data-vite-client-id='client-id'
        data-vite-keycloak-url='https://dev.loginproxy.gov.bc.ca/auth/realms/standard'
        data-vite-zone='ZONE'
        data-vite-backend-url='https://example.test/api'
      ></div>
    `;

    const { env } = await import('../env');

    expect(env.VITE_KEYCLOAK_CLIENT_ID).toBe('client-id');
    expect(env.VITE_KEYCLOAK_URL).toBe('https://dev.loginproxy.gov.bc.ca/auth/realms/standard');
    expect(env.VITE_ZONE).toBe('ZONE');
    expect(env.VITE_BACKEND_URL).toBe('https://example.test/api');
  });

  test('returns import meta values when data attributes contain unresolved placeholders', async () => {
    document.body.innerHTML = `
      <div
        id="root"
        data-vite-client-id='{{env "VITE_KEYCLOAK_CLIENT_ID"}}'
        data-vite-keycloak-url='{{env "VITE_KEYCLOAK_URL"}}'
        data-vite-zone='{{env "VITE_ZONE"}}'
        data-vite-backend-url='{{env "VITE_BACKEND_URL"}}'
      ></div>
    `;

    const { env } = await import('../env');

    expect(env.VITE_KEYCLOAK_CLIENT_ID).toBeUndefined();
    expect(env.VITE_KEYCLOAK_URL).toBeUndefined();
    expect(env.VITE_ZONE).toBeUndefined();
    expect(env.VITE_BACKEND_URL).toBeUndefined();
  });
});
