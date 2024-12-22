import { defineConfig } from 'vite';

export default defineConfig({
  base: '/spa/', 
  server: {
    proxy: {
      '/api': {
        target: 'http://mahaepos.gov.in',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying request:', proxyReq.path);
          });
        },
      },
    },
  },
  
});