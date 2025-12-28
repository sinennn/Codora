// Terminal Logger - sends console output to your terminal during development

const isDev = import.meta.env.DEV

function sendToTerminal(level: string, args: unknown[]) {
  if (!isDev) return
  
  // Serialize args safely
  const serializedArgs = args.map(arg => {
    if (arg instanceof Error) {
      return { message: arg.message, stack: arg.stack }
    }
    try {
      return JSON.parse(JSON.stringify(arg))
    } catch {
      return String(arg)
    }
  })

  fetch('/api/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level, args: serializedArgs })
  }).catch(() => {}) // Silently fail if server unavailable
}

// Store original console methods
const originalConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  info: console.info.bind(console),
  debug: console.debug.bind(console)
}

// Override console methods
export function enableTerminalLogging() {
  console.log = (...args) => {
    originalConsole.log(...args)
    sendToTerminal('log', args)
  }
  console.warn = (...args) => {
    originalConsole.warn(...args)
    sendToTerminal('warn', args)
  }
  console.error = (...args) => {
    originalConsole.error(...args)
    sendToTerminal('error', args)
  }
  console.info = (...args) => {
    originalConsole.info(...args)
    sendToTerminal('info', args)
  }
  console.debug = (...args) => {
    originalConsole.debug(...args)
    sendToTerminal('debug', args)
  }
}

// Restore original console methods
export function disableTerminalLogging() {
  console.log = originalConsole.log
  console.warn = originalConsole.warn
  console.error = originalConsole.error
  console.info = originalConsole.info
  console.debug = originalConsole.debug
}
