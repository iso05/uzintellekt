import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),  // ← shu yo'q edi! CSS yuklanmayotgan sabab shu
  ],
  base: '/uzintellekt/', // ← GitHub Pages uchun
})
