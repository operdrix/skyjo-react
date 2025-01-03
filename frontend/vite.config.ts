import react from '@vitejs/plugin-react-swc';
import { defineConfig, loadEnv } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    define: {
      'process.env': env
    },
    plugins: [react()],
    base: '/',
    resolve: {
      alias: {
        '@': '/src'
      }
    },
    build: {
      minify: 'esbuild',
    },
    esbuild: {
      drop: ['console', 'debugger']
    }
  }
})
