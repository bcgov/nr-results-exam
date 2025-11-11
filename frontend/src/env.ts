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
  const poolId = rootElement.getAttribute('data-vite-pool-id');
  const zone = rootElement.getAttribute('data-vite-zone');
  const backendUrl = rootElement.getAttribute('data-vite-backend-url');
  
  // If any value contains template syntax, config hasn't been replaced yet (dev mode)
  if (clientId?.includes('{{') || !clientId) {
    return {};
  }
  
  return {
    VITE_USER_POOLS_WEB_CLIENT_ID: clientId,
    VITE_USER_POOLS_ID: poolId || undefined,
    VITE_ZONE: zone || undefined,
    VITE_BACKEND_URL: backendUrl || undefined
  };
}

export const env: Record<string, string | undefined> = { ...import.meta.env, ...getConfigFromMeta() }
