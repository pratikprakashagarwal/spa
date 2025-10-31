import { defineConfig } from 'vite';

export default defineConfig({
  base: '/spa/',
  server: {
    proxy: {
      '/api': {
        target: 'https://epos.mahafood.gov.in',  // ✅ correct domain + https
        changeOrigin: true,
        secure: false, // ✅ skip SSL issues if govt site has old certs
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
