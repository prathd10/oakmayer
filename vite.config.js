import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    {
      name: 'admin-routing',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url.split('?')[0];
          if (url === '/menu') {
            req.url = '/menu/index.html';
          } else if (url === '/gifting') {
            req.url = '/gifting/index.html';
          } else if (url === '/corporate') {
            req.url = '/corporate/index.html';
          } else if (url.startsWith('/admin') && !url.substring(url.lastIndexOf('/')).includes('.')) {
            req.url = '/admin/index.html';
          }
          next();
        });
      }
    }
  ],
  server: {
    proxy: {
      '/imagekit-api': {
        target: 'https://api.imagekit.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/imagekit-api/, '')
      },
      '/imagekit-upload': {
        target: 'https://upload.imagekit.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/imagekit-upload/, '')
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        menu: resolve(__dirname, 'menu/index.html'),
        gifting: resolve(__dirname, 'gifting/index.html'),
        corporate: resolve(__dirname, 'corporate/index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
      },
    },
  },
})
