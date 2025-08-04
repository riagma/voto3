import { defineConfig } from 'vite';
// import { nodePolyfills } from 'vite-plugin-node-polyfills';


// export default defineConfig({
//   plugins: [
//     nodePolyfills({
//       include: ['buffer', 'process'],
//       globals: {
//         Buffer: true,
//         process: true
//       }
//     }),
//   ],
//   optimizeDeps: {
//     exclude: [
//       '@noir-lang/noirc_abi',
//       '@noir-lang/acvm_js',
//       'main.worker.js'
//     ]
//   },
//   server: {
//     proxy: {
//       '/api': 'http://localhost:3000'
//     }
//   },
//   rollupOptions: {
//     input: 'index.html',
//     output: {
//       dir: 'dist',
//       format: 'esm'
//     }
//   }
// });

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
    rollupOptions: {
      input: {
        main: './index.html'
      },
      output: {
        manualChunks: {
          // Divide las dependencias grandes en chunks separados
          algosdk: ['algosdk'],
          barretenberg: ['@aztec/bb.js'],
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
