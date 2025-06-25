#!/bin/bash
echo "启动WordWeb本地服务器..."
echo "请在浏览器中访问: http://localhost:8000"
echo "按 Ctrl+C 停止服务器"
cd "$(dirname "$0")"
python3 -m http.server 8000
