import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  server: {
    watch: { ignored: ['**/.local/**', '**/.sites-runtime/**', '**/test-results/**'] },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'three-core', test: /node_modules[\\/]three[\\/]build[\\/]three\.core\.js$/ },
            { name: 'three-renderer', test: /node_modules[\\/]three[\\/]/ },
          ],
        },
      },
    },
  },
})
