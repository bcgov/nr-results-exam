declare global {
  interface Window {
    global: Window & typeof globalThis;
  }
}

export {};
