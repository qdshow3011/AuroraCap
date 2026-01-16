import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
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
    },
    server: {
        // 添加IBKR API代理配置，解决开发环境CORS问题
        // 部署到Vercel时，Vercel会自动处理API请求，不需要此代理配置
        proxy: {
            '/api/ibkr': {
                target: 'https://gdcdyn.interactivebrokers.com',
                changeOrigin: true,
                rewrite: function (path) { return path.replace(/^\/api\/ibkr/, ''); },
                secure: true,
                timeout: 90000, // 90秒超时
                followRedirects: true,
            },
            '/api/yahoo-finance': {
                target: 'https://query1.finance.yahoo.com',
                changeOrigin: true,
                rewrite: function (path) { return path.replace(/^\/api\/yahoo-finance/, ''); },
                secure: true,
                timeout: 30000, // 30秒超时
                followRedirects: true,
            },
        },
    },
});
