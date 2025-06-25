/**
 * 数据库管理器
 * 提供统一的数据管理接口，整合各种数据模型和存储管理器
 */

class DatabaseManager {
    constructor() {
        this.storageManager = new LocalStorageManager();
        this.models = {
            user: UserModel,
            document: DocumentModel,
            vocabulary: VocabularyModel
        };
        this.currentUser = null;
        this.cache = new Map(); // 内存缓存
        this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存过期
        
        this.initializeDatabase();
    }

    /**
     * 初始化数据库
     */
    async initializeDatabase() {
        try {
            // 检查数据库版本并进行迁移
            await this.checkAndMigrate();
            
            // 加载当前用户
            await this.loadCurrentUser();
            
            console.log('数据库初始化完成');
        } catch (error) {
            console.error('数据库初始化失败:', error);
        }
    }

    /**
     * 检查数据库版本并执行迁移
     */
    async checkAndMigrate() {
        const currentVersion = this.storageManager.load('system', 'db_version') || '1.0.0';
        const targetVersion = '1.0.0';
        
        if (currentVersion !== targetVersion) {
            console.log(`数据库版本从 ${currentVersion} 升级到 ${targetVersion}`);
            await this.runMigrations(currentVersion, targetVersion);
            this.storageManager.save('system', targetVersion, 'db_version');
        }
    }

    /**
     * 运行数据迁移
     */
    async runMigrations(fromVersion, toVersion) {
        // 这里可以添加数据迁移逻辑
        console.log('执行数据迁移...');
    }

    /**
     * 加载当前用户
     */
    async loadCurrentUser() {
        const userId = this.storageManager.load('system', 'current_user_id');
        if (userId) {
            this.currentUser = await this.getUser(userId);
        }
        
        // 如果没有用户，创建默认用户
        if (!this.currentUser) {
            this.currentUser = await this.createDefaultUser();
        }
    }

    /**
     * 创建默认用户
     */
    async createDefaultUser() {
        const userData = {
            displayName: '默认用户',
            username: 'default_user',
            email: ''
        };
        
        const user = new UserModel(userData);
        await this.saveUser(user);
        this.storageManager.save('system', user.id, 'current_user_id');
        
        console.log('创建默认用户:', user.id);
        return user;
    }

    /**
     * 保存用户数据
     */
    async saveUser(user) {
        if (!(user instanceof UserModel)) {
            throw new Error('必须是 UserModel 实例');
        }
        
        user.validate();
        const saved = this.storageManager.save('user', user.toJSON(), user.id);
        
        if (saved) {
            this.cache.set(`user_${user.id}`, {
                data: user,
                timestamp: Date.now()
            });
        }
        
        return saved;
    }

    /**
     * 获取用户数据
     */
    async getUser(userId) {
        // 检查缓存
        const cached = this.getCachedData(`user_${userId}`);
        if (cached) {
            return cached;
        }
        
        const userData = this.storageManager.load('user', userId);
        if (userData) {
            const user = UserModel.fromJSON(userData);
            this.setCachedData(`user_${userId}`, user);
            return user;
        }
        
        return null;
    }

    /**
     * 保存文档数据
     */
    async saveDocument(document) {
        if (!(document instanceof DocumentModel)) {
            throw new Error('必须是 DocumentModel 实例');
        }
        
        document.validate();
        document.updateWordCount(); // 更新字数统计
        
        const saved = this.storageManager.save('document', document.toJSON(), document.id);
        
        if (saved) {
            this.cache.set(`document_${document.id}`, {
                data: document,
                timestamp: Date.now()
            });
            
            // 更新用户统计
            if (this.currentUser) {
                this.currentUser.updateStatistics({
                    totalWords: this.currentUser.statistics.totalWords + document.wordCount
                });
                await this.saveUser(this.currentUser);
            }
        }
        
        return saved;
    }

    /**
     * 获取文档数据
     */
    async getDocument(documentId) {
        // 检查缓存
        const cached = this.getCachedData(`document_${documentId}`);
        if (cached) {
            return cached;
        }
        
        const documentData = this.storageManager.load('document', documentId);
        if (documentData) {
            const document = DocumentModel.fromJSON(documentData);
            this.setCachedData(`document_${documentId}`, document);
            return document;
        }
        
        return null;
    }

    /**
     * 获取所有文档
     */
    async getAllDocuments() {
        const documentsData = this.storageManager.loadAll('document');
        const documents = [];
        
        for (const [id, data] of Object.entries(documentsData)) {
            try {
                const document = DocumentModel.fromJSON(data);
                if (document.status === 'active') { // 只返回活跃文档
                    documents.push(document);
                }
            } catch (error) {
                console.error(`加载文档失败 ${id}:`, error);
            }
        }
        
        return documents;
    }

    /**
     * 删除文档
     */
    async deleteDocument(documentId) {
        const document = await this.getDocument(documentId);
        if (document) {
            document.markAsDeleted();
            await this.saveDocument(document);
            
            // 从缓存中移除
            this.cache.delete(`document_${documentId}`);
            
            // 更新用户统计
            if (this.currentUser) {
                this.currentUser.decrementDocumentCount();
                await this.saveUser(this.currentUser);
            }
            
            return true;
        }
        
        return false;
    }

    /**
     * 保存词汇数据
     */
    async saveVocabulary(vocabulary) {
        if (!(vocabulary instanceof VocabularyModel)) {
            throw new Error('必须是 VocabularyModel 实例');
        }
        
        vocabulary.validate();
        const saved = this.storageManager.save('vocabulary', vocabulary.toJSON(), vocabulary.id);
        
        if (saved) {
            this.cache.set(`vocabulary_${vocabulary.id}`, {
                data: vocabulary,
                timestamp: Date.now()
            });
        }
        
        return saved;
    }

    /**
     * 获取词汇数据
     */
    async getVocabulary(vocabularyId) {
        // 检查缓存
        const cached = this.getCachedData(`vocabulary_${vocabularyId}`);
        if (cached) {
            return cached;
        }
        
        const vocabularyData = this.storageManager.load('vocabulary', vocabularyId);
        if (vocabularyData) {
            const vocabulary = VocabularyModel.fromJSON(vocabularyData);
            this.setCachedData(`vocabulary_${vocabularyId}`, vocabulary);
            return vocabulary;
        }
        
        return null;
    }

    /**
     * 获取所有词汇
     */
    async getAllVocabulary() {
        const vocabularyData = this.storageManager.loadAll('vocabulary');
        const vocabularies = [];
        
        for (const [id, data] of Object.entries(vocabularyData)) {
            try {
                const vocabulary = VocabularyModel.fromJSON(data);
                if (vocabulary.isActive) { // 只返回活跃词汇
                    vocabularies.push(vocabulary);
                }
            } catch (error) {
                console.error(`加载词汇失败 ${id}:`, error);
            }
        }
        
        return vocabularies;
    }

    /**
     * 获取需要复习的词汇
     */
    async getVocabularyForReview(limit = 20) {
        const allVocabulary = await this.getAllVocabulary();
        const needsReview = allVocabulary
            .filter(vocab => vocab.needsReview())
            .sort((a, b) => {
                // 按掌握程度升序排列，掌握程度低的优先复习
                if (a.masteryLevel !== b.masteryLevel) {
                    return a.masteryLevel - b.masteryLevel;
                }
                // 如果掌握程度相同，按最后复习时间升序排列
                return new Date(a.lastReviewAt || 0) - new Date(b.lastReviewAt || 0);
            });
        
        return needsReview.slice(0, limit);
    }

    /**
     * 搜索文档
     */
    async searchDocuments(query, options = {}) {
        const documents = await this.getAllDocuments();
        const {
            searchFields = ['title', 'content', 'tags'],
            language = '',
            folderPath = '',
            sortBy = 'updatedAt',
            sortOrder = 'desc',
            limit = 50
        } = options;
        
        const queryLower = query.toLowerCase();
        
        let results = documents.filter(doc => {
            // 语言过滤
            if (language && doc.language !== language) {
                return false;
            }
            
            // 文件夹过滤
            if (folderPath !== '' && doc.folderPath !== folderPath) {
                return false;
            }
            
            // 内容搜索
            return searchFields.some(field => {
                if (field === 'tags') {
                    return doc.tags.some(tag => tag.toLowerCase().includes(queryLower));
                } else if (doc[field]) {
                    return doc[field].toLowerCase().includes(queryLower);
                }
                return false;
            });
        });
        
        // 排序
        results.sort((a, b) => {
            const aValue = a[sortBy];
            const bValue = b[sortBy];
            
            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
        
        return results.slice(0, limit);
    }

    /**
     * 搜索词汇
     */
    async searchVocabulary(query, options = {}) {
        const vocabularies = await this.getAllVocabulary();
        const {
            searchFields = ['word', 'definition', 'translation'],
            language = '',
            difficulty = 0,
            masteryLevel = 0,
            limit = 50
        } = options;
        
        const queryLower = query.toLowerCase();
        
        let results = vocabularies.filter(vocab => {
            // 语言过滤
            if (language && vocab.language !== language) {
                return false;
            }
            
            // 难度过滤
            if (difficulty > 0 && vocab.difficulty !== difficulty) {
                return false;
            }
            
            // 掌握程度过滤
            if (masteryLevel > 0 && vocab.masteryLevel < masteryLevel) {
                return false;
            }
            
            // 内容搜索
            return searchFields.some(field => {
                if (vocab[field]) {
                    return vocab[field].toLowerCase().includes(queryLower);
                }
                return false;
            });
        });
        
        return results.slice(0, limit);
    }

    /**
     * 获取统计信息
     */
    async getStatistics() {
        const documents = await this.getAllDocuments();
        const vocabularies = await this.getAllVocabulary();
        const needsReview = vocabularies.filter(v => v.needsReview());
        
        return {
            documents: {
                total: documents.length,
                languages: this.getLanguageStats(documents),
                totalWords: documents.reduce((sum, doc) => sum + doc.wordCount, 0),
                avgReadingProgress: documents.length > 0 
                    ? Math.round(documents.reduce((sum, doc) => sum + doc.readingProgress, 0) / documents.length)
                    : 0
            },
            vocabulary: {
                total: vocabularies.length,
                needsReview: needsReview.length,
                languages: this.getLanguageStats(vocabularies),
                avgMasteryLevel: vocabularies.length > 0
                    ? Math.round(vocabularies.reduce((sum, vocab) => sum + vocab.masteryLevel, 0) / vocabularies.length)
                    : 0,
                difficultyDistribution: this.getDifficultyStats(vocabularies)
            },
            storage: this.storageManager.getStorageInfo()
        };
    }

    /**
     * 获取语言统计
     */
    getLanguageStats(items) {
        const stats = {};
        items.forEach(item => {
            const lang = item.language || 'Unknown';
            stats[lang] = (stats[lang] || 0) + 1;
        });
        return stats;
    }

    /**
     * 获取难度分布统计
     */
    getDifficultyStats(vocabularies) {
        const stats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        vocabularies.forEach(vocab => {
            stats[vocab.difficulty] = (stats[vocab.difficulty] || 0) + 1;
        });
        return stats;
    }

    /**
     * 缓存操作
     */
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    setCachedData(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    /**
     * 清空缓存
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * 数据备份
     */
    async backup() {
        const backupData = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            user: this.currentUser ? this.currentUser.toJSON() : null,
            documents: await this.getAllDocuments().then(docs => docs.map(d => d.toJSON())),
            vocabulary: await this.getAllVocabulary().then(vocabs => vocabs.map(v => v.toJSON())),
            storage: this.storageManager.exportData()
        };
        
        return backupData;
    }

    /**
     * 数据恢复
     */
    async restore(backupData) {
        if (!backupData || !backupData.version) {
            throw new Error('无效的备份数据');
        }
        
        // 清空现有数据
        this.storageManager.clearAll();
        this.clearCache();
        
        // 恢复数据
        if (backupData.storage) {
            this.storageManager.importData(backupData.storage);
        }
        
        // 重新初始化
        await this.initializeDatabase();
        
        return true;
    }

    /**
     * 清空所有数据
     */
    async clearAllData() {
        const cleared = this.storageManager.clearAll();
        this.clearCache();
        this.currentUser = null;
        
        // 重新初始化
        await this.initializeDatabase();
        
        return cleared;
    }
}

// 导出到全局
window.DatabaseManager = DatabaseManager;
