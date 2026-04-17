import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Chunks manuels pour que les libs lourdes (PDF, graphiques) soient
    // téléchargées à la demande au lieu d'être bundlées dans l'entry.
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-pdf': ['jspdf', 'html2canvas'],
          'vendor-charts': ['recharts'],
          'vendor-search': ['fuse.js'],
        },
      },
    },
    // Le warning à 500 KB est bruyant une fois qu'on a split proprement
    // les gros morceaux ; on remonte le seuil à 700 KB.
    chunkSizeWarningLimit: 700,
  },
});
