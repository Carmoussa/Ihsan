import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT : remplace "Ihsan" par le nom exact de ton dépôt GitHub, s'il diffère
// (respecte la casse : majuscules/minuscules comptent ici).
// Si ton site est publié sur https://tonpseudo.github.io/Ihsan/, base doit être '/Ihsan/'.
// Si tu utilises un domaine personnalisé ou un site "tonpseudo.github.io" (dépôt racine), mets base: '/'.
export default defineConfig({
  plugins: [react()],
  base: '/Ihsan',
  server: {
    port: 5175,
    strictPort: true,
  }
})
