import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const config = {
    define: {} as any,
    plugins: [
      {
        name: 'build-html',
        apply: 'build',
        transformIndexHtml: (html) => {
          // Inject Caddy template placeholders as data attributes on the root div
          // Caddy's env function will safely escape values when templates are processed at runtime
          // This avoids CSP inline script issues while allowing runtime config
          const configPlaceholder = `data-vite-client-id='{{env "VITE_USER_POOLS_WEB_CLIENT_ID"}}' data-vite-pool-id='{{env "VITE_USER_POOLS_ID"}}' data-vite-zone='{{env "VITE_ZONE"}}'`;
          const modifiedHtml = html.replace('<div id="root"></div>', `<div id="root" ${configPlaceholder}></div>`);
          
          return {
            html: modifiedHtml,
            tags: []
          }
        }
      },
      react()
    ],
    build: {
      outDir: 'build'
    },
    server: {
      port: 3000,
      hmr:{
        overlay:false
      },
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Cross-Origin-Embedder-Policy': 'credentialless'
      }
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        // Use lottie-web light version to avoid eval() security issues
        // Light version excludes expression support which requires eval
        'lottie-web': 'lottie-web/build/player/lottie_light'
      }
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      css: true,
      reporters: ['verbose'],
      coverage: {
        provider: 'v8',
        reporter: ['lcov', 'text-summary'],
        reportsDirectory: './coverage',
        include: ['src/**/*'],
        exclude: [
          'src/amplifyconfiguration.ts',
          'src/reportWebVitals.ts'
        ],
        thresholds: {
          statements: 70,
          branches: 70,
          functions: 70,
          lines: 70
        }
      }
    }
  };

  if (mode === 'development') {
    config.define.global = {};
  }

  return config;
});
