/**
 * 数据库迁移脚本
 * 版本 1.0.0 -> 1.0.1
 */

class Migration_1_0_1 {
    constructor(storageManager) {
        this.storageManager = storageManager;
        this.version = '1.0.1';
    }

    /**
     * 执行迁移
     */
    async up() {
        console.log('执行迁移到版本 1.0.1...');
        
        try {
            // 示例：为所有用户添加新的统计字段
            await this.migrateUserData();
            
            // 示例：为所有文档添加新的元数据字段
            await this.migrateDocumentData();
            
            // 示例：为所有词汇添加新的复习算法字段
            await this.migrateVocabularyData();
            
            console.log('迁移到版本 1.0.1 完成');
            return true;
        } catch (error) {
            console.error('迁移失败:', error);
            return false;
        }
    }

    /**
     * 回滚迁移
     */
    async down() {
        console.log('回滚版本 1.0.1 的迁移...');
        
        try {
            // 执行回滚操作
            // 这里添加回滚逻辑
            
            console.log('回滚完成');
            return true;
        } catch (error) {
            console.error('回滚失败:', error);
            return false;
        }
    }

    /**
     * 迁移用户数据
     */
    async migrateUserData() {
        const userData = this.storageManager.loadAll('user');
        
        for (const [userId, user] of Object.entries(userData)) {
            // 添加新的统计字段
            if (!user.statistics.weeklyGoal) {
                user.statistics.weeklyGoal = {
                    documentsToRead: 5,
                    wordsToLearn: 50,
                    readingTimeTarget: 300 // 5小时
                };
            }
            
            if (!user.statistics.achievements) {
                user.statistics.achievements = [];
            }
            
            // 保存更新后的用户数据
            this.storageManager.save('user', user, userId);
        }
        
        console.log(`迁移了 ${Object.keys(userData).length} 个用户数据`);
    }

    /**
     * 迁移文档数据
     */
    async migrateDocumentData() {
        const documentData = this.storageManager.loadAll('document');
        
        for (const [docId, document] of Object.entries(documentData)) {
            // 添加新的元数据字段
            if (!document.metadata.readingSpeed) {
                document.metadata.readingSpeed = 0; // 阅读速度（词/分钟）
            }
            
            if (!document.metadata.estimatedReadingTime) {
                document.metadata.estimatedReadingTime = 0; // 预计阅读时间（分钟）
            }
            
            // 计算预计阅读时间（假设平均阅读速度200词/分钟）
            if (document.wordCount > 0) {
                document.metadata.estimatedReadingTime = Math.ceil(document.wordCount / 200);
            }
            
            // 保存更新后的文档数据
            this.storageManager.save('document', document, docId);
        }
        
        console.log(`迁移了 ${Object.keys(documentData).length} 个文档数据`);
    }

    /**
     * 迁移词汇数据
     */
    async migrateVocabularyData() {
        const vocabularyData = this.storageManager.loadAll('vocabulary');
        
        for (const [vocabId, vocabulary] of Object.entries(vocabularyData)) {
            // 添加新的复习算法字段
            if (!vocabulary.reviewAlgorithm) {
                vocabulary.reviewAlgorithm = 'spaced-repetition';
            }
            
            if (!vocabulary.retentionRate) {
                vocabulary.retentionRate = 0.8; // 默认保持率
            }
            
            // 重新计算下次复习时间（如果使用新算法）
            if (vocabulary.lastReviewAt && !vocabulary.nextReviewAt) {
                const lastReview = new Date(vocabulary.lastReviewAt);
                const nextReview = new Date(lastReview.getTime() + 24 * 60 * 60 * 1000); // 1天后
                vocabulary.nextReviewAt = nextReview.toISOString();
            }
            
            // 保存更新后的词汇数据
            this.storageManager.save('vocabulary', vocabulary, vocabId);
        }
        
        console.log(`迁移了 ${Object.keys(vocabularyData).length} 个词汇数据`);
    }

    /**
     * 验证迁移结果
     */
    async validate() {
        try {
            // 验证用户数据
            const userData = this.storageManager.loadAll('user');
            for (const [userId, user] of Object.entries(userData)) {
                if (!user.statistics.weeklyGoal || !user.statistics.achievements) {
                    throw new Error(`用户 ${userId} 迁移不完整`);
                }
            }
            
            // 验证文档数据
            const documentData = this.storageManager.loadAll('document');
            for (const [docId, document] of Object.entries(documentData)) {
                if (!document.metadata.hasOwnProperty('readingSpeed')) {
                    throw new Error(`文档 ${docId} 迁移不完整`);
                }
            }
            
            // 验证词汇数据
            const vocabularyData = this.storageManager.loadAll('vocabulary');
            for (const [vocabId, vocabulary] of Object.entries(vocabularyData)) {
                if (!vocabulary.reviewAlgorithm) {
                    throw new Error(`词汇 ${vocabId} 迁移不完整`);
                }
            }
            
            console.log('迁移验证通过');
            return true;
        } catch (error) {
            console.error('迁移验证失败:', error);
            return false;
        }
    }
}

// 导出到全局
window.Migration_1_0_1 = Migration_1_0_1;
