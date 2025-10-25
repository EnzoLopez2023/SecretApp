import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and MUI
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          // Separate chunks for heavy components
          'plex-tools': ['./src/PlexAPIClient.tsx', './src/PlexMovieInsights.tsx', './src/PlaylistCreator.tsx'],
          'workshop-tools': ['./src/MyShopTools.tsx', './src/WoodworkingProjects.tsx'],
          'utility-tools': ['./src/ExcelToJsonConverter.tsx', './src/ChatApp.tsx']
        }
      }
    },
    chunkSizeWarningLimit: 1000 // Increase warning threshold to 1MB
  }
})
