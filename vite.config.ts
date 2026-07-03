import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      // Target modern browsers — smaller, faster output
      target: 'es2020',
      // Raise chunk size warning threshold (our bundles are intentionally split)
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: (id: string) => {
            // ── Vendor chunks ─────────────────────────────────────────
            // React core — tiny, cached aggressively
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'react-core';
            }
            // React Router
            if (id.includes('node_modules/react-router')) {
              return 'router';
            }
            // Framer Motion / motion.dev — large, rarely changes
            if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) {
              return 'motion';
            }
            // Particles — very large, only loaded on tier 2/3 devices
            if (id.includes('node_modules/@tsparticles') || id.includes('node_modules/tsparticles')) {
              return 'particles';
            }
            // Supabase client
            if (id.includes('node_modules/@supabase')) {
              return 'supabase';
            }
            // Lucide icons
            if (id.includes('node_modules/lucide-react')) {
              return 'icons';
            }
            // All remaining node_modules → shared vendor chunk
            if (id.includes('node_modules/')) {
              return 'vendor';
            }
          },
        },
      },
    },
  };
});
