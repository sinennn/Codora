import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Custom plugin to log messages from browser to terminal
function terminalLoggerPlugin() {
  return {
    name: 'terminal-logger',
    configureServer(server) {
      server.middlewares.use('/api/log', (req, res) => {
        let body = ''
        req.on('data', chunk => body += chunk)
        req.on('end', () => {
          try {
            const { level, args } = JSON.parse(body)
            const timestamp = new Date().toLocaleTimeString()
            const prefix = `[${timestamp}] [${level.toUpperCase()}]`
            console.log(prefix, ...args)
          } catch (e) {
            console.log('[LOG]', body)
          }
          res.end('ok')
        })
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    terminalLoggerPlugin()
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})