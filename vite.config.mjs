import { defineConfig } from 'vite';

// base: './' 让构建产物可在任意路径（含 Capacitor WebView 的 file/自定义协议）下加载
export default defineConfig({
  base: './',
  server: {
    proxy: {
      '/api': 'http://localhost:8080'
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
