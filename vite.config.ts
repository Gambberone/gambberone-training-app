import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';

const buildId = new Date().toISOString();

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_BUILD_ID__: JSON.stringify(buildId),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'firebase-firestore', test: /node_modules[\\/]@firebase[\\/]firestore[\\/]/ },
            { name: 'firebase-auth', test: /node_modules[\\/]@firebase[\\/]auth[\\/]/ },
          ],
        },
      },
    },
  },
  plugins: [
    vue(),
    tailwindcss(),
    {
      name: 'clear-legacy-dev-service-worker',
      apply: 'serve',
      transformIndexHtml: {
        order: 'pre',
        handler() {
          return [{
            tag: 'script',
            injectTo: 'head-prepend',
            children: `if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(async (registrations) => {
                const rootScope = new URL('/', location.href).href;
                const oldRegistrations = registrations.filter((registration) => registration.scope === rootScope);
                if (!oldRegistrations.length) return;
                await Promise.all(oldRegistrations.map((registration) => registration.unregister()));
                if (navigator.serviceWorker.controller) location.reload();
              }).catch(() => {});
            }`,
          }];
        },
      },
    },
    {
      name: 'app-version',
      apply: 'build',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({ buildId }),
        });
      },
    },
  ],
});
