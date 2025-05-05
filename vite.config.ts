import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// Export a function to conditionally set base path based on environment
export default defineConfig(() => {
  // Use '/typing-master/' only when building in GitHub Actions for Pages deployment
  const base = process.env.GITHUB_ACTIONS === 'true' ? '/typing-master/' : '/';
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    base: base, // Set base path conditionally
  };
})
