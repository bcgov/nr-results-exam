interface WindowConfig {
  [key: string]: string | undefined;
}

declare global {
  interface Window {
    config?: WindowConfig;
  }
}

export const env: Record<string, string | undefined> = { ...import.meta.env, ...window.config }
