import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  // EdgeOne Pages 兼容配置
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // 确保资源使用相对路径或根路径
    rollupOptions: {
      output: {
        manualChunks: undefined, // MVP 阶段无需代码分割
      },
    },
  },
});
