import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import fs from 'node:fs'
import path from 'node:path'

const DATA_FILE = path.join(process.cwd(), 'shared-data.json')

// 种子数据（首次无文件时使用）
function makeSeedData() {
  return {
    directions: ['增长', '安全', '公共模块'],
    members: [
      { id: 'seed-member-1', name: '陈浩', role: 'iOS' },
      { id: 'seed-member-2', name: '林岚', role: 'Android' },
    ],
    projects: [],
  }
}

// 数据文件中间件（Vite Connect 格式）
function dataFileMiddleware(
  req: { url?: string; method?: string },
  res: { setHeader: (k: string, v: string) => void; end: (d: string) => void; statusCode?: number },
  next: () => void,
) {
  if (req.url !== '/api/data') {
    next()
    return
  }

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.end()
    return
  }

  if (req.method === 'GET') {
    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8')
        res.end(raw)
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ error: 'Failed to read data file' }))
      }
      return
    }
    // 文件不存在 → 创建种子数据
    const seed = makeSeedData()
    fs.writeFileSync(DATA_FILE, JSON.stringify(seed, null, 2), 'utf-8')
    res.end(JSON.stringify(seed))
    return
  }

  if (req.method === 'POST') {
    let body = ''
    req.on('data', (chunk: Buffer) => { body += chunk.toString() })
    req.on('end', () => {
      try {
        fs.writeFileSync(DATA_FILE, body, 'utf-8')
        res.end(body)
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ error: 'Failed to write data file' }))
      }
    })
    return
  }

  next()
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const dataServerUrl = (env.VITE_DATA_SERVER_URL as string) || ''

  return {
    plugins: [
      react(),
      tsconfigPaths(),
      {
        name: 'data-file-middleware',
        configureServer(server) {
          server.middlewares.use(dataFileMiddleware as never)
        },
      },
    ],
    server: {
      port: 5173,
      open: false,
      host: '0.0.0.0',
      allowedHosts: ['bore.pub', 'localhost', '127.0.0.1'],
    },
    define: {
      'import.meta.env.VITE_DATA_SERVER_URL': JSON.stringify(dataServerUrl),
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
    },
  }
})
