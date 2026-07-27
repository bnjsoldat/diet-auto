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
        manualChunks(id) {
          // Le preload-helper virtuel de Vite (~1 KB) est requis par TOUT
          // chunk qui fait un import() dynamique. Sans routage explicite,
          // Rollup l'avait placé dans vendor-pdf → chaque page chargeait
          // 174 KB gzip de jsPDF juste pour ce helper. On le colle dans
          // vendor-react (chargé partout de toute façon).
          if (id.includes('vite/preload-helper')) return 'vendor-react';
          // clsx (~400 octets) est une dépendance de recharts ET de toute
          // l'app (via cn()). Sans routage explicite, Rollup le plaçait
          // dans vendor-charts → chaque page chargeait 112 KB gzip de
          // Recharts pour cette seule fonction. On le met dans vendor-react.
          if (id.includes('node_modules/clsx')) return 'vendor-react';
          // Vendors lourds : splits classiques
          if (id.includes('node_modules/react-router')) return 'vendor-react';
          if (id.includes('node_modules/react-dom')) return 'vendor-react';
          if (id.includes('node_modules/scheduler')) return 'vendor-react';
          if (id.match(/node_modules\/react(?![-a-z])/)) return 'vendor-react';
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas'))
            return 'vendor-pdf';
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-'))
            return 'vendor-charts';
          if (id.includes('node_modules/fuse.js')) return 'vendor-search';
          // Base d'aliments CIQUAL (~479 KB) : dans son propre chunk, partagé
          // entre Today/Week/Recipes/Shopping/Favorites/History, jamais dans
          // le chunk principal.
          if (
            id.endsWith('foods.json') ||
            id.endsWith('foods-extras.json') ||
            id.endsWith('foods-units.json') ||
            id.endsWith('foods-unit-patterns.json')
          )
            return 'data-foods';
        },
      },
    },
    // Le warning à 500 KB est bruyant une fois qu'on a split proprement
    // les gros morceaux ; on remonte le seuil à 700 KB.
    chunkSizeWarningLimit: 700,
  },
});
