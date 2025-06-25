# 单词学习助手 - 项目结构说明

## 📁 项目概览

这是一个功能完整的单词学习助手应用，现在已经集成了强大的数据库系统来管理用户数据、文档和词汇学习记录。

## 🗂️ 文件结构

```
wordweb/
├── 📄 index.html              # 主页面
├── 📄 vocabulary.html         # 词汇页面  
├── 📄 review.html            # 复习页面
├── 📄 README.md              # 项目说明
├── 📄 script-modular.js      # 主应用脚本
├── 📄 test-menu.js           # 测试菜单脚本
│
├── 📁 css/                   # 样式文件
│   ├── base.css              # 基础样式
│   ├── library.css           # 书库样式
│   ├── navigation.css        # 导航样式
│   ├── modals.css           # 弹窗样式
│   ├── reader.css           # 阅读器样式
│   ├── context-menu.css     # 右键菜单样式
│   ├── sidebar-menu.css     # 侧边栏样式
│   ├── unified-header.css   # 统一头部样式
│   ├── unified-header-simplified.css
│   ├── unified-header-modals.css
│   ├── navigation-updates.css
│   └── custom-color-picker.css
│
├── 📁 js/                    # JavaScript 模块
│   ├── context-menu.js       # 右键菜单管理
│   ├── custom-color-picker.js # 颜色选择器
│   ├── demo-data.js          # 演示数据
│   ├── folder-manager.js     # 文件夹管理 ⭐ 已集成数据库
│   ├── modal-manager.js      # 弹窗管理
│   ├── sidebar-manager.js    # 侧边栏管理
│   ├── theme-manager.js      # 主题管理
│   ├── unified-header-manager.js # 头部管理
│   └── vocabulary-manager.js # 词汇管理
│
└── 📁 db/                    # 数据库系统 🆕
    ├── 📄 README.md          # 数据库系统文档
    ├── 📄 db-init.js         # 数据库初始化脚本
    ├── 📄 database-manager.js # 数据库管理器
    ├── 📄 example-usage.js   # 使用示例
    ├── 📄 admin-panel.js     # 管理界面
    │
    ├── 📁 models/            # 数据模型
    │   ├── base-model.js     # 基础模型类
    │   ├── user-model.js     # 用户数据模型
    │   ├── document-model.js # 文档数据模型
    │   └── vocabulary-model.js # 词汇数据模型
    │
    ├── 📁 storage/           # 存储管理
    │   └── local-storage-manager.js # 本地存储管理器
    │
    └── 📁 migrations/        # 数据迁移
        ├── migration-manager.js # 迁移管理器
        └── migration-1.0.1.js  # 示例迁移文件
```

## 🚀 新增功能

### 数据库系统
- ✅ **完整的数据模型**: 用户、文档、词汇三大核心模型
- ✅ **智能存储管理**: 自动压缩、缓存、存储监控
- ✅ **数据迁移支持**: 版本升级时自动迁移数据
- ✅ **备份恢复功能**: 完整的数据备份和恢复机制
- ✅ **搜索和统计**: 强大的数据搜索和统计分析
- ✅ **管理界面**: 可视化的数据库管理面板

### 学习功能增强
- ✅ **间隔重复算法**: 科学的词汇复习调度
- ✅ **学习进度追踪**: 详细的学习统计和进度记录
- ✅ **个性化设置**: 丰富的用户偏好设置
- ✅ **智能推荐**: 基于学习情况的复习推荐

## 🔧 使用方法

### 基本使用
1. 打开 `index.html`
2. 数据库系统会自动初始化
3. 开始创建文档和学习词汇

### 高级功能

#### 数据库管理面板
- 按 `Ctrl+Shift+D` 打开管理面板
- 或在控制台执行 `showDatabaseAdmin()`

#### 功能测试
在浏览器控制台执行以下命令：
```javascript
// 运行数据库功能示例
runDatabaseExample()

// 查看文件夹管理器集成状态
demonstrateFolderIntegration()

// 查看数据库统计
dbManager.getStatistics().then(console.log)
```

## 📊 数据管理

### 数据模型

#### 用户模型 (UserModel)
```javascript
{
    displayName: "用户名",
    preferences: { theme: "light", fontSize: 16, ... },
    statistics: { totalDocuments: 10, vocabularySize: 500, ... }
}
```

#### 文档模型 (DocumentModel)
```javascript
{
    title: "文档标题",
    content: "文档内容",
    language: "English",
    readingProgress: 75,
    vocabulary: [...], // 关联词汇
    notes: [...],      // 笔记
    bookmarks: [...]   // 书签
}
```

#### 词汇模型 (VocabularyModel)
```javascript
{
    word: "hello",
    pronunciation: "/həˈloʊ/",
    definition: "问候语",
    masteryLevel: 85,
    reviewHistory: [...], // 复习记录
    nextReviewAt: "2024-01-03T12:00:00.000Z"
}
```

### 存储特性
- 📦 **自动压缩**: 大数据自动压缩存储
- 🔄 **智能缓存**: 5分钟内存缓存提升性能
- 📈 **存储监控**: 实时监控存储使用情况
- 🔒 **数据安全**: 基础加密和数据完整性检查

## 🎯 核心特性

### 文件夹管理 (已集成数据库)
- 📁 两层文件结构 (文件夹 -> 文档)
- 🧩 与数据库无缝集成
- 📊 实时同步文档状态
- 🔄 支持文档移动和组织

### 词汇学习系统
- 🧠 间隔重复算法
- 📈 掌握程度追踪
- 🎯 智能复习推荐
- 📝 多样化学习记录

### 阅读体验
- 📖 沉浸式阅读界面
- 🎨 多主题支持
- 📱 响应式设计
- ⚡ 快速导航

## 🔍 调试和监控

### 开发者工具
```javascript
// 查看数据库状态
console.log('数据库状态:', dbManager ? '已连接' : '未连接');

// 查看缓存情况
console.log('缓存大小:', dbManager.cache.size);

// 存储使用情况
console.log('存储信息:', dbManager.storageManager.getStorageInfo());

// 清理和重置
dbManager.clearCache(); // 清理缓存
dbManager.clearAllData(); // 清空所有数据 (谨慎使用)
```

### 日志监控
- 数据库操作会在控制台输出详细日志
- 管理面板提供可视化的操作日志
- 错误会自动记录并显示

## 🚧 扩展性

### 添加新功能
1. **新的数据模型**: 继承 `BaseModel` 类
2. **新的存储后端**: 实现存储接口
3. **新的页面**: 复制现有页面结构

### 自定义配置
- 修改 `db/models/` 中的模型定义
- 调整 `db/storage/` 中的存储策略
- 扩展 `js/` 中的应用逻辑

## 📋 待办事项

### 短期目标
- [ ] 完善词汇复习界面
- [ ] 添加数据导入向导
- [ ] 优化移动端体验
- [ ] 添加键盘快捷键

### 长期规划
- [ ] 云端同步支持
- [ ] 多语言界面
- [ ] 社交学习功能
- [ ] AI 辅助学习

## 🐛 故障排除

### 常见问题
1. **数据库初始化失败**: 检查控制台错误，确认所有脚本正确加载
2. **数据丢失**: 使用管理面板的备份功能定期备份
3. **性能问题**: 定期清理缓存和旧数据
4. **存储空间不足**: 使用压缩功能或清理不必要的数据

### 恢复数据
1. 打开数据库管理面板 (`Ctrl+Shift+D`)
2. 使用"导入备份"功能
3. 或使用 `dbManager.restore(backupData)` 方法

## 🤝 贡献指南

### 开发环境
1. 克隆项目到本地
2. 使用现代浏览器打开 `index.html`
3. 打开开发者工具进行调试

### 代码规范
- 使用 ES6+ 语法
- 遵循现有的命名约定
- 添加适当的注释和文档
- 确保数据库操作的事务安全

---

🎉 **恭喜！** 你现在拥有一个功能完整、数据安全的单词学习助手！

开始使用：打开 `index.html` 并按 `Ctrl+Shift+D` 查看数据库管理面板。
