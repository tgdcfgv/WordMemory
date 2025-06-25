# WordWeb 部署指南

## 快速启动

### 方法1：使用内置启动脚本

#### Windows用户
1. 双击 `start-server.bat` 文件
2. 在浏览器中访问 `http://localhost:8000`

#### Linux/Mac用户
1. 在终端中运行：
   ```bash
   chmod +x start-server.sh
   ./start-server.sh
   ```
2. 在浏览器中访问 `http://localhost:8000`

### 方法2：手动启动Python服务器

1. 打开终端/命令提示符
2. 进入项目目录：
   ```bash
   cd /path/to/wordweb
   ```
3. 启动Python服务器：
   ```bash
   # Python 3
   python -m http.server 8000
   
   # 或者 Python 2
   python -m SimpleHTTPServer 8000
   ```
4. 在浏览器中访问 `http://localhost:8000`

### 方法3：使用Node.js服务器

如果你有Node.js环境：

1. 全局安装http-server：
   ```bash
   npm install -g http-server
   ```
2. 在项目目录运行：
   ```bash
   http-server -p 8000
   ```

## 在线部署

### 部署到GitHub Pages

1. 将项目上传到GitHub仓库
2. 在仓库设置中启用GitHub Pages
3. 选择从main分支部署
4. 访问 `https://yourusername.github.io/wordweb`

### 部署到Netlify

1. 将项目文件夹拖拽到Netlify网站
2. 或者连接GitHub仓库进行自动部署

### 部署到Vercel

1. 安装Vercel CLI：`npm i -g vercel`
2. 在项目目录运行：`vercel`
3. 按提示完成部署

## 故障排除

### 常见问题

1. **CORS错误**：必须通过HTTP服务器访问，不能直接打开HTML文件
2. **模块加载失败**：确保所有JavaScript文件路径正确
3. **Python命令不存在**：安装Python 3.x版本

### 浏览器兼容性

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 注意事项

- 本应用使用LocalStorage存储数据，数据保存在浏览器中
- 清除浏览器数据会导致应用数据丢失
- 建议定期使用应用内的导出功能备份数据
