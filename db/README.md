# 单词学习助手 - 数据库系统

## 概述

该数据库系统为单词学习助手提供完整的数据存储和管理功能，包括用户数据、文档管理、词汇学习记录等。系统采用模块化设计，支持数据迁移、备份恢复等高级功能。

## 文件结构

```
db/
├── models/                 # 数据模型
│   ├── base-model.js      # 基础模型类
│   ├── user-model.js      # 用户数据模型
│   ├── document-model.js  # 文档数据模型
│   └── vocabulary-model.js # 词汇数据模型
├── storage/               # 存储管理
│   └── local-storage-manager.js # 本地存储管理器
├── migrations/            # 数据迁移
│   ├── migration-manager.js     # 迁移管理器
│   └── migration-1.0.1.js      # 示例迁移文件
├── database-manager.js    # 数据库管理器
└── db-init.js            # 数据库初始化脚本
```

## 核心功能

### 1. 数据模型

#### 用户模型 (UserModel)
- 用户基本信息管理
- 偏好设置存储
- 学习统计追踪
- 登录记录管理

#### 文档模型 (DocumentModel)
- 文档内容管理
- 阅读进度追踪
- 词汇标注存储
- 笔记和书签管理

#### 词汇模型 (VocabularyModel)
- 词汇信息存储
- 间隔重复复习算法
- 掌握程度追踪
- 复习历史记录

### 2. 存储管理

#### 本地存储管理器 (LocalStorageManager)
- 统一的数据持久化接口
- 数据压缩和加密
- 存储空间管理
- 数据导入导出

### 3. 数据库管理

#### 数据库管理器 (DatabaseManager)
- 统一的数据操作接口
- 内存缓存管理
- 数据搜索和统计
- 备份和恢复功能

### 4. 数据迁移

#### 迁移管理器 (MigrationManager)
- 版本升级管理
- 自动数据迁移
- 回滚支持
- 备份保护

## 使用方法

### 初始化数据库

```javascript
// 方法1：自动初始化（推荐）
document.addEventListener('databaseReady', (event) => {
    const dbManager = event.detail.databaseManager;
    console.log('数据库已准备就绪');
});

// 方法2：手动初始化
const dbManager = await window.initializeDatabase();

// 方法3：获取已初始化的实例
const dbManager = window.getDatabaseManager();
```

### 用户数据操作

```javascript
// 获取当前用户
const currentUser = dbManager.currentUser;

// 更新用户偏好
currentUser.updatePreferences({
    theme: 'dark',
    language: 'zh-CN',
    fontSize: 18
});
await dbManager.saveUser(currentUser);

// 记录学习活动
currentUser.recordReadingActivity(30); // 30分钟
await dbManager.saveUser(currentUser);
```

### 文档操作

```javascript
// 创建新文档
const document = new DocumentModel({
    title: '英语学习文章',
    content: '这是文档内容...',
    language: 'English',
    tags: ['学习', '英语']
});
await dbManager.saveDocument(document);

// 获取文档
const doc = await dbManager.getDocument(documentId);

// 更新阅读进度
doc.updateReadingProgress(50); // 50%
await dbManager.saveDocument(doc);

// 添加词汇
doc.addVocabulary('hello', '你好', '问候语');
await dbManager.saveDocument(doc);

// 搜索文档
const results = await dbManager.searchDocuments('英语', {
    language: 'English',
    sortBy: 'updatedAt'
});
```

### 词汇操作

```javascript
// 创建词汇
const vocabulary = new VocabularyModel({
    word: 'hello',
    pronunciation: '/həˈloʊ/',
    definition: 'used as a greeting',
    translation: '你好',
    language: 'English'
});
await dbManager.saveVocabulary(vocabulary);

// 记录复习
vocabulary.recordReview(true, 10); // 正确，花费10秒
await dbManager.saveVocabulary(vocabulary);

// 获取需要复习的词汇
const reviewList = await dbManager.getVocabularyForReview(20);

// 搜索词汇
const vocabResults = await dbManager.searchVocabulary('hello', {
    difficulty: 2,
    masteryLevel: 50
});
```

### 统计信息

```javascript
// 获取综合统计
const stats = await dbManager.getStatistics();
console.log('文档总数:', stats.documents.total);
console.log('词汇总数:', stats.vocabulary.total);
console.log('需要复习:', stats.vocabulary.needsReview);

// 存储使用情况
console.log('存储使用:', stats.storage.totalSizeFormatted);
```

### 备份和恢复

```javascript
// 创建备份
const backupData = await dbManager.backup();

// 恢复数据
await dbManager.restore(backupData);

// 清空所有数据
await dbManager.clearAllData();
```

## 数据格式说明

### 用户数据格式

```javascript
{
    id: "user_1234567890_abc123def",
    displayName: "用户名",
    email: "user@example.com",
    preferences: {
        theme: "light",
        language: "zh-CN",
        fontSize: 16,
        // ... 更多偏好设置
    },
    statistics: {
        totalDocuments: 10,
        totalWords: 5000,
        totalReadingTime: 120,
        // ... 更多统计数据
    },
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T12:00:00.000Z"
}
```

### 文档数据格式

```javascript
{
    id: "doc_1234567890_abc123def",
    title: "文档标题",
    content: "文档内容...",
    language: "English",
    tags: ["标签1", "标签2"],
    wordCount: 500,
    readingProgress: 75,
    vocabulary: [
        {
            id: "vocab_item_123",
            word: "hello",
            definition: "问候语",
            context: "Hello, how are you?"
        }
    ],
    notes: [
        {
            id: "note_123",
            content: "这是一个笔记",
            position: 100
        }
    ],
    folderPath: "英语学习/基础词汇",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T12:00:00.000Z"
}
```

### 词汇数据格式

```javascript
{
    id: "vocab_1234567890_abc123def",
    word: "hello",
    pronunciation: "/həˈloʊ/",
    definition: "used as a greeting",
    translation: "你好",
    language: "English",
    difficulty: 2,
    masteryLevel: 75,
    reviewCount: 5,
    correctCount: 4,
    lastReviewAt: "2024-01-01T12:00:00.000Z",
    nextReviewAt: "2024-01-03T12:00:00.000Z",
    contexts: [
        {
            id: "context_123",
            sentence: "Hello, how are you?",
            translation: "你好，你怎么样？"
        }
    ],
    reviewHistory: [
        {
            id: "review_123",
            isCorrect: true,
            timeSpent: 10,
            reviewedAt: "2024-01-01T12:00:00.000Z"
        }
    ],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T12:00:00.000Z"
}
```

## 事件系统

数据库系统提供以下事件：

- `databaseReady`: 数据库初始化完成
- `databaseError`: 数据库初始化或操作错误

```javascript
// 监听数据库就绪事件
document.addEventListener('databaseReady', (event) => {
    const dbManager = event.detail.databaseManager;
    // 开始使用数据库
});

// 监听数据库错误事件
document.addEventListener('databaseError', (event) => {
    const error = event.detail.error;
    console.error('数据库错误:', error);
});
```

## 性能优化

### 缓存机制
- 内存缓存常用数据
- 5分钟缓存过期时间
- 自动清理过期缓存

### 存储优化
- 超过10KB的数据自动压缩
- 批量操作支持
- 存储空间监控

### 搜索优化
- 索引化搜索字段
- 分页结果返回
- 搜索结果排序

## 扩展性

### 添加新的数据模型
1. 继承 `BaseModel` 类
2. 实现必要的验证方法
3. 在 `DatabaseManager` 中注册

### 添加新的存储后端
1. 实现存储接口
2. 替换 `LocalStorageManager`
3. 保持API兼容性

### 添加数据迁移
1. 创建迁移类
2. 实现 `up()` 和 `down()` 方法
3. 在 `MigrationManager` 中注册

## 注意事项

1. 所有异步操作都使用 `async/await`
2. 数据验证在保存前自动执行
3. 错误处理统一通过异常机制
4. 大数据量操作建议分批处理
5. 定期清理缓存和旧备份

## 故障排除

### 常见问题

1. **数据库初始化失败**
   - 检查脚本加载顺序
   - 确认所有依赖文件存在
   - 查看控制台错误信息

2. **存储空间不足**
   - 使用 `cleanupOldData()` 清理
   - 检查存储使用情况
   - 考虑数据压缩

3. **数据迁移失败**
   - 检查备份是否存在
   - 验证迁移脚本语法
   - 回滚到安全版本

4. **性能问题**
   - 清理缓存
   - 减少搜索范围
   - 使用分页加载
