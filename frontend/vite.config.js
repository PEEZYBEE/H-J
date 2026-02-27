import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  server: {
    port: 5173,
    host: '0.0.0.0', // Listen on all addresses
    allowedHosts: [
      'supervital-unstoried-trace.ngrok-free.dev',
      '.ngrok-free.dev'  // Allow all ngrok-free.dev subdomains
    ],
    hmr: {
      // Use the same host as the server for HMR
      host: 'supervital-unstoried-trace.ngrok-free.dev',
      protocol: 'wss', // Use wss for HTTPS
      clientPort: 443, // Standard HTTPS port
    },
    proxy: {
      // Proxy /api requests to your Flask backend
      '/api': {
        target: 'http://localhost:5000', // Your backend
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // Keep the path as is
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
})