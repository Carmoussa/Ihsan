import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT : remplace "ihsan" par le nom exact de ton dépôt GitHub, s'il diffère.
// Si ton site est publié sur https://tonpseudo.github.io/ihsan/, base doit être '/ihsan/'.
// Si tu utilises un domaine personnalisé ou un site "tonpseudo.github.io" (dépôt racine), mets base: '/'.
export default defineConfig({
  plugins: [react()],
  base: '/ihsan/',
})
