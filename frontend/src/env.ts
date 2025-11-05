interface WindowConfig {
  [key: string]: string | undefined;
}

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    config?: WindowConfig;
  }
}

// eslint-disable-next-line import/prefer-default-export
export const env: Record<string, string | undefined> = { ...import.meta.env, ...window.config }
