<<<<<<< HEAD
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config'
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
          return {
            html,
            tags: [
              {
                tag: 'script',
                attrs: {
                  src: '/env.js'
                },
                injectTo: 'head'
              }
            ]
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
      }
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
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
        reporter: ['text', 'json', 'html'],
        include: ['src/**/*'],
        exclude: [],
      }
    },
  };

  if (mode === 'development') {
    config.define.global = {};
  }

  return config;
});
=======
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.PORT),
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..'],
    },
    proxy: {
      // Proxy API requests to the backend
      '/api': {
        target: process.env.BACKEND_URL,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    // https://vitejs.dev/config/shared-options.html#resolve-alias
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~': fileURLToPath(new URL('./node_modules', import.meta.url)),
    },
    extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue'],
  },
  build: {
    // Build Target
    // https://vitejs.dev/config/build-options.html#build-target
    target: 'esnext',
    // Minify option
    // https://vitejs.dev/config/build-options.html#build-minify
    minify: 'esbuild',
    // Rollup Options
    // https://vitejs.dev/config/build-options.html#build-rollupoptions
    rollupOptions: {
      output: {
        manualChunks: {
          // Split external library from transpiled code.
          react: [
            'react',
            'react-dom',
            'react-router-dom',
            'react-router',
            '@emotion/react',
            '@emotion/styled',
          ],
          mui: ['@mui/material', '@mui/icons-material'],
          mui_tables: ['mui-datatables'],
          axios: ['axios'],
        },
      },
    },
  },
})
>>>>>>> 2577926 (Initial commit)
