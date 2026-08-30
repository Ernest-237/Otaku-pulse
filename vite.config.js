import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Tailwind v4 s'active via son plugin Vite : aucun fichier tailwind.config.js
  // ni postcss.config.js n'est nécessaire. Le thème est déclaré en CSS dans
  // src/styles/admin.css.
  plugins: [react(), tailwindcss()],
})
