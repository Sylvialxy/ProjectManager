#!/usr/bin/env node
/**
 * ProjectManager 数据共享服务端（ESM 版本）
 * GET /data  → 读取 shared-data.json
 * POST /data → 写入 shared-data.json
 */

import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = 3001;
const DATA_FILE = join(__dirname, 'shared-data.json');

// 初始化数据文件
function initDataFile() {
  if (!existsSync(DATA_FILE)) {
    const defaultData = JSON.stringify(
      { directions: ['增长', '安全', '公共模块'], members: [], projects: [], lastUpdated: null, updatedBy: null },
      null,
      2,
    );
    writeFileSync(DATA_FILE, defaultData, 'utf-8');
    console.log('[DataServer] 初始化数据文件:', DATA_FILE);
  }
}

// 解析请求体
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : null); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

// 发送 JSON 响应
function jsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

// 路由
async function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'OPTIONS') { jsonResponse(res, 204, null); return; }

  // GET /data
  if (req.method === 'GET' && url.pathname === '/data') {
    try {
      const raw = readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw);
      console.log(`[${new Date().toLocaleTimeString()}] GET /data — OK`);
      jsonResponse(res, 200, data);
    } catch (err) {
      console.error('[DataServer] 读取失败:', err.message);
      jsonResponse(res, 200, { directions: [], members: [], projects: [], lastUpdated: null, updatedBy: null });
    }
    return;
  }

  // POST /data
  if (req.method === 'POST' && url.pathname === '/data') {
    try {
      const body = await parseBody(req);
      if (!body || body.directions === undefined) {
        jsonResponse(res, 400, { error: 'Invalid data: need directions/members/projects' });
        return;
      }
      const withMeta = { ...body, lastUpdated: new Date().toISOString() };
      writeFileSync(DATA_FILE, JSON.stringify(withMeta, null, 2), 'utf-8');
      console.log(`[${new Date().toLocaleTimeString()}] POST /data — OK`);
      jsonResponse(res, 200, { success: true });
    } catch (err) {
      jsonResponse(res, 400, { error: err.message });
    }
    return;
  }

  jsonResponse(res, 404, { error: 'Not found' });
}

// 启动
initDataFile();

const server = createServer(handleRequest);
server.listen(PORT, '0.0.0.0', () => {
  console.log('[DataServer] 数据服务端已启动');
  console.log(`[DataServer] 监听 http://0.0.0.0:${PORT}`);
  console.log(`[DataServer] 数据文件: ${DATA_FILE}`);
  console.log('');
  console.log('接口:');
  console.log('  GET  /data  → 读取数据');
  console.log('  POST /data  → 写入数据 { directions, members, projects }');
});

process.on('SIGINT', () => {
  console.log('\n[DataServer] 正在关闭...');
  server.close(() => { console.log('[DataServer] 已关闭'); process.exit(0); });
});
