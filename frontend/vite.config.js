import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
  build: {
    outDir: '../backend/public', // para que el backend sirva los estáticos directamente
    emptyOutDir: true, // Vaciar el directorio de salida
    sourcemap: true,
    target: 'esnext',
    chunkSizeWarningLimit: 1000, // Aumentar límite de advertencia
    rollupOptions: {
      input: {
        main: './index.html'
      },
      output: {
        manualChunks: (id) => {
          // Separar las librerías pesadas en chunks individuales
          if (id.includes('algosdk')) {
            return 'algosdk';
          }
          if (id.includes('@aztec/bb.js')) {
            return 'barretenberg-core';
          }
          if (id.includes('@noir-lang/noir_js')) {
            return 'noir';
          }
          if (id.includes('bootstrap')) {
            return 'bootstrap';
          }
          // Mantener las WASM en chunks separados
          if (id.includes('.wasm')) {
            return 'wasm-files';
          }
          // Agrupar utilidades comunes
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: { target: "esnext" },
    exclude: ['@noir-lang/noirc_abi', '@noir-lang/acvm_js']
  },
  define: {
    global: 'globalThis'
  },
  resolve: {
    alias: {
      '@': './src'
    }
  }
});
