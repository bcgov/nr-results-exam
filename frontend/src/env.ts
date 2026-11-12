interface WindowConfig {
  [key: string]: string | undefined;
}

/**
 * Reads application configuration from data attributes on the root div.
 * This is used to inject environment-specific config at deployment time
 * without requiring inline scripts, keeping the CSP strict.
 *
 * @returns {WindowConfig} The parsed configuration object or empty object if not found
 */
function getConfigFromMeta(): WindowConfig {
  if (typeof document === 'undefined') {
    return {};
  }

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    return {};
  }

  const clientId = rootElement.getAttribute('data-vite-client-id');
  const keycloakUrl = rootElement.getAttribute('data-vite-keycloak-url');
  const zone = rootElement.getAttribute('data-vite-zone');
  const backendUrl = rootElement.getAttribute('data-vite-backend-url');

  // Check if templates have been processed by Caddy
  // If any value contains template syntax, templates haven't been processed yet
  // Return empty object to fall back to import.meta.env values
  const hasUnprocessedTemplates =
    clientId?.includes('{{') ||
    keycloakUrl?.includes('{{') ||
    zone?.includes('{{') ||
    backendUrl?.includes('{{');

  if (hasUnprocessedTemplates) {
    return {};
  }

  // Only return values that are actually present (not null/empty)
  // This allows import.meta.env to provide fallback values
  const config: WindowConfig = {};
  if (clientId) config.VITE_KEYCLOAK_CLIENT_ID = clientId;
  if (keycloakUrl) config.VITE_KEYCLOAK_URL = keycloakUrl;
  if (zone) config.VITE_ZONE = zone;
  if (backendUrl) config.VITE_BACKEND_URL = backendUrl;

  return config;
}

export const env: Record<string, string | undefined> = {
  ...import.meta.env,
  ...getConfigFromMeta(),
};
