#!/bin/bash
# ProjectManager 远程分享脚本
# 用法：./share.sh
# 数据读写本地 shared-data.json，远程只读查看

PROJECT_DIR="$HOME/Desktop/DevManage/ProjectManager"
DEV_PORT=5173

echo "=== ProjectManager 远程分享 ==="
echo ""

# 杀掉旧的占用进程
killPort() {
  local port=$1
  local pid=$(lsof -ti :$port 2>/dev/null)
  if [ -n "$pid" ]; then
    echo "   停止占用端口 $port 的进程 (PID: $pid)"
    kill $pid 2>/dev/null || true
    sleep 1
  fi
}

echo "[1/2] 检查端口占用..."
killPort $DEV_PORT

# 启动 dev server（Vite 中间件直接读写 shared-data.json，无需独立 data-server）
echo "[2/2] 启动 dev server (端口 $DEV_PORT)..."
cd "$PROJECT_DIR"
npm run dev &
DEV_PID=$!
echo "   dev server PID: $DEV_PID"

# 等待启动
sleep 3

# 获取本机 IP
HOST_IP=$(ifconfig | grep 'inet ' | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

echo ""
echo "=========================================="
echo "=== 分享已启动 ==="
echo "=========================================="
echo ""
echo "📋 数据文件: $PROJECT_DIR/shared-data.json"
echo ""
echo "🌐 远程只读访问（发给同事）："
echo "   http://$HOST_IP:$DEV_PORT/?readonly=1"
echo ""
echo "💻 本地访问："
echo "   http://localhost:$DEV_PORT"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""
echo "=========================================="
echo "=== 使用说明 ==="
echo "=========================================="
echo "1. 把上面的远程访问地址复制给同事"
echo "2. 同事打开后以只读模式查看数据（无法编辑）"
echo "3. 你的本地数据读写都直接操作 shared-data.json"
echo ""

# 等待用户中断
wait
