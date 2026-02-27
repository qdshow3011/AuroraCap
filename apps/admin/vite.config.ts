import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // Enable sourcemap for dependencies
      sourcemap: true,
    },
  },
  build: {
    // Enable sourcemap for debugging
    sourcemap: true,
    // Adjust chunk size warning limit (in kB)
    chunkSizeWarningLimit: 10000, // 10000 kB = 10 MB
    // Optimize chunking strategy
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Ant Design chunks
          antd: ['antd', '@ant-design/icons'],
          // Refine chunks
          refine: ['@refinedev/core', '@refinedev/antd', '@refinedev/react-router-v6'],
          // Supabase chunks
          supabase: ['@supabase/supabase-js', '@refinedev/supabase'],

        },
      },
    },
  },
  server: {
    // 添加IBKR API代理配置，解决开发环境CORS问题
    // 部署到Vercel时，Vercel会自动处理API请求，不需要此代理配置
    proxy: {
      '/api/ibkr': {
        target: 'https://gdcdyn.interactivebrokers.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ibkr/, ''),
        secure: true,
        timeout: 90000, // 90秒超时
        followRedirects: true,
      },
      '/api/yahoo-finance': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/yahoo-finance/, ''),
        secure: true,
        timeout: 30000, // 30秒超时
        followRedirects: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // 添加必要的请求头
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            proxyReq.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8');
            proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.5');
            proxyReq.setHeader('Accept-Encoding', 'gzip, deflate, br');
            proxyReq.setHeader('Connection', 'keep-alive');
            proxyReq.setHeader('Upgrade-Insecure-Requests', '1');
            proxyReq.setHeader('Sec-Fetch-Dest', 'document');
            proxyReq.setHeader('Sec-Fetch-Mode', 'navigate');
            proxyReq.setHeader('Sec-Fetch-Site', 'none');
            proxyReq.setHeader('Sec-Fetch-User', '?1');
            proxyReq.setHeader('Cache-Control', 'max-age=0');
          });
        },
      },
    },
  },
})