interface WindowConfig {
  [key: string]: string | undefined;
}

/**
 * Reads application configuration from a meta tag in the HTML.
 * This is used to inject environment-specific config at deployment time
 * without requiring inline scripts, keeping the CSP strict.
 *
 * @returns {WindowConfig} The parsed configuration object or empty object if not found
 */
function getConfigFromMeta(): WindowConfig {
  if (typeof document === 'undefined') {
    return {};
  }
  
  const metaTag = document.querySelector('meta[name="app-config"]');
  if (!metaTag) {
    return {};
  }
  
  const content = metaTag.getAttribute('content');
  if (!content || content === '__APP_CONFIG__') {
    return {};
  }
  
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to parse app config from meta tag:', e);
    return {};
  }
}

export const env: Record<string, string | undefined> = { ...import.meta.env, ...getConfigFromMeta() }
