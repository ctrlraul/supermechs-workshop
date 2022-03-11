import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import legacy from '@vitejs/plugin-legacy'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  publicDir: 'static',
  build: {
    outDir: 'public',
  },
})
