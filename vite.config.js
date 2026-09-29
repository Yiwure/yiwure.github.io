import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// 用户站点仓库（yiwure.github.io）部署在域名根路径，base 用 '/'
export default defineConfig({
  base: '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    // 单页应用：资源内联阈值调小一点，避免首屏太多请求
    assetsInlineLimit: 4096,
  },
})
