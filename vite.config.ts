import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import browserslistToEsbuild from 'browserslist-to-esbuild'

const buildTarget = browserslistToEsbuild()

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],

  build: {
    target: buildTarget,
    outDir: './dist',
    rollupOptions: {
      output: {
        assetFileNames: () => {
          return `[name].[hash].[ext]`
        },
        entryFileNames: () => {
          return `[name].[hash].js`
        },
      },
    },
  },
})
