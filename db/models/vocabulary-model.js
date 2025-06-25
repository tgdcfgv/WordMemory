/**
 * 词汇数据模型
 * 管理用户学习的词汇和复习记录
 */

class VocabularyModel extends BaseModel {
    constructor(data = {}) {
        super(data);
        this.word = data.word || '';
        this.pronunciation = data.pronunciation || '';
        this.definition = data.definition || '';
        this.translation = data.translation || '';
        this.language = data.language || 'English';
        this.partOfSpeech = data.partOfSpeech || ''; // 词性
        this.contexts = data.contexts || []; // 上下文例句
        this.difficulty = data.difficulty || 1; // 1-5 难度等级
        this.reviewCount = data.reviewCount || 0;
        this.correctCount = data.correctCount || 0;
        this.lastReviewAt = data.lastReviewAt || null;
        this.nextReviewAt = data.nextReviewAt || null;
        this.masteryLevel = data.masteryLevel || 0; // 0-100 掌握程度
        this.tags = data.tags || [];
        this.sourceDocumentId = data.sourceDocumentId || null; // 来源文档
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.reviewHistory = data.reviewHistory || []; // 复习历史记录
        this.notes = data.notes || ''; // 用户笔记
        this.audioUrl = data.audioUrl || ''; // 发音音频URL
        this.imageUrl = data.imageUrl || ''; // 关联图片URL
    }

    /**
     * 添加上下文例句
     */
    addContext(sentence, translation = '') {
        const context = {
            id: this.generateId(),
            sentence: sentence.trim(),
            translation: translation.trim(),
            addedAt: new Date().toISOString()
        };
        
        this.contexts.push(context);
        this.touch();
        return context.id;
    }

    /**
     * 移除上下文例句
     */
    removeContext(contextId) {
        const index = this.contexts.findIndex(c => c.id === contextId);
        if (index !== -1) {
            this.contexts.splice(index, 1);
            this.touch();
        }
    }

    /**
     * 记录复习结果
     */
    recordReview(isCorrect, timeSpent = 0, reviewType = 'manual') {
        const reviewRecord = {
            id: this.generateId(),
            isCorrect: isCorrect,
            timeSpent: timeSpent, // 复习花费时间（秒）
            reviewType: reviewType, // manual, quiz, auto
            reviewedAt: new Date().toISOString(),
            difficultyAtTime: this.difficulty,
            masteryLevelBefore: this.masteryLevel
        };

        this.reviewHistory.push(reviewRecord);
        this.reviewCount += 1;
        
        if (isCorrect) {
            this.correctCount += 1;
        }

        this.lastReviewAt = reviewRecord.reviewedAt;
        this.updateMasteryLevel(isCorrect);
        this.calculateNextReviewTime();
        this.touch();

        return reviewRecord.id;
    }

    /**
     * 更新掌握程度
     */
    updateMasteryLevel(isCorrect) {
        const accuracyRate = this.reviewCount > 0 ? (this.correctCount / this.reviewCount) : 0;
        
        if (isCorrect) {
            // 正确答案增加掌握程度
            this.masteryLevel = Math.min(100, this.masteryLevel + (10 - this.difficulty * 2));
        } else {
            // 错误答案减少掌握程度
            this.masteryLevel = Math.max(0, this.masteryLevel - (5 + this.difficulty));
        }

        // 根据准确率调整
        if (accuracyRate >= 0.8) {
            this.masteryLevel = Math.min(100, this.masteryLevel + 5);
        } else if (accuracyRate < 0.5) {
            this.masteryLevel = Math.max(0, this.masteryLevel - 3);
        }
    }

    /**
     * 计算下次复习时间（使用间隔重复算法）
     */
    calculateNextReviewTime() {
        if (!this.lastReviewAt) {
            // 首次复习后1天
            this.nextReviewAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            return;
        }

        const accuracyRate = this.reviewCount > 0 ? (this.correctCount / this.reviewCount) : 0;
        let intervalDays = 1;

        // 基于掌握程度和准确率计算间隔
        if (this.masteryLevel >= 80 && accuracyRate >= 0.8) {
            intervalDays = Math.min(30, Math.pow(2, Math.floor(this.reviewCount / 3))); // 最长30天
        } else if (this.masteryLevel >= 60 && accuracyRate >= 0.6) {
            intervalDays = Math.min(14, Math.pow(1.5, Math.floor(this.reviewCount / 4))); // 最长14天
        } else if (this.masteryLevel >= 40 && accuracyRate >= 0.4) {
            intervalDays = Math.min(7, Math.pow(1.3, Math.floor(this.reviewCount / 5))); // 最长7天
        } else {
            intervalDays = Math.min(3, Math.max(1, this.reviewCount / 3)); // 1-3天
        }

        // 根据难度调整
        intervalDays = intervalDays / this.difficulty;

        const nextReviewTime = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);
        this.nextReviewAt = nextReviewTime.toISOString();
    }

    /**
     * 检查是否需要复习
     */
    needsReview() {
        if (!this.nextReviewAt) {
            return true; // 从未复习过
        }
        
        return new Date() >= new Date(this.nextReviewAt);
    }

    /**
     * 更新难度等级
     */
    updateDifficulty(newDifficulty) {
        if (newDifficulty >= 1 && newDifficulty <= 5) {
            this.difficulty = newDifficulty;
            this.calculateNextReviewTime(); // 重新计算复习时间
            this.touch();
        }
    }

    /**
     * 添加标签
     */
    addTag(tag) {
        const trimmedTag = tag.trim();
        if (trimmedTag && !this.tags.includes(trimmedTag)) {
            this.tags.push(trimmedTag);
            this.touch();
        }
    }

    /**
     * 移除标签
     */
    removeTag(tag) {
        const index = this.tags.indexOf(tag);
        if (index !== -1) {
            this.tags.splice(index, 1);
            this.touch();
        }
    }

    /**
     * 设置来源文档
     */
    setSourceDocument(documentId) {
        this.sourceDocumentId = documentId;
        this.touch();
    }

    /**
     * 激活/停用词汇
     */
    setActive(isActive) {
        this.isActive = isActive;
        this.touch();
    }

    /**
     * 更新用户笔记
     */
    updateNotes(notes) {
        this.notes = notes.trim();
        this.touch();
    }

    /**
     * 获取复习统计
     */
    getReviewStats() {
        const accuracyRate = this.reviewCount > 0 ? (this.correctCount / this.reviewCount) : 0;
        const recentReviews = this.reviewHistory.slice(-10); // 最近10次复习
        
        return {
            reviewCount: this.reviewCount,
            correctCount: this.correctCount,
            accuracyRate: Math.round(accuracyRate * 100),
            masteryLevel: this.masteryLevel,
            difficulty: this.difficulty,
            needsReview: this.needsReview(),
            nextReviewAt: this.nextReviewAt,
            lastReviewAt: this.lastReviewAt,
            recentAccuracy: recentReviews.length > 0 
                ? Math.round((recentReviews.filter(r => r.isCorrect).length / recentReviews.length) * 100)
                : 0
        };
    }

    /**
     * 验证词汇数据
     */
    validate() {
        super.validate();
        
        if (!this.word || this.word.trim().length === 0) {
            throw new Error('单词不能为空');
        }
        
        if (this.difficulty < 1 || this.difficulty > 5) {
            throw new Error('难度等级必须在1-5之间');
        }
        
        if (this.masteryLevel < 0 || this.masteryLevel > 100) {
            throw new Error('掌握程度必须在0-100之间');
        }
        
        return true;
    }

    /**
     * 获取词汇摘要信息
     */
    getSummary() {
        return {
            id: this.id,
            word: this.word,
            pronunciation: this.pronunciation,
            definition: this.definition,
            translation: this.translation,
            language: this.language,
            partOfSpeech: this.partOfSpeech,
            difficulty: this.difficulty,
            masteryLevel: this.masteryLevel,
            reviewCount: this.reviewCount,
            lastReviewAt: this.lastReviewAt,
            nextReviewAt: this.nextReviewAt,
            needsReview: this.needsReview(),
            tags: this.tags.slice(),
            isActive: this.isActive
        };
    }
}

// 导出到全局
window.VocabularyModel = VocabularyModel;
