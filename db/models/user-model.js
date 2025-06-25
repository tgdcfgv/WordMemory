/**
 * 用户数据模型
 * 管理用户基本信息和偏好设置
 */

class UserModel extends BaseModel {
    constructor(data = {}) {
        super(data);
        this.username = data.username || '';
        this.email = data.email || '';
        this.displayName = data.displayName || '';
        this.avatar = data.avatar || '';
        this.preferences = data.preferences || this.getDefaultPreferences();
        this.statistics = data.statistics || this.getDefaultStatistics();
        this.lastLoginAt = data.lastLoginAt || null;
        this.isActive = data.isActive !== undefined ? data.isActive : true;
    }

    /**
     * 获取默认用户偏好设置
     */
    getDefaultPreferences() {
        return {
            theme: 'light', // light, dark, auto
            language: 'zh-CN',
            fontSize: 16,
            fontFamily: 'system',
            autoSave: true,
            autoBackup: true,
            readingMode: 'normal', // normal, focus, immersive
            highlightColor: '#ffeb3b',
            defaultVocabularyLanguage: 'English',
            showWordTranslation: true,
            showWordPronunciation: true,
            enableKeyboardShortcuts: true,
            enableSoundEffects: true,
            libraryView: 'grid', // grid, list
            itemsPerPage: 20,
            sortBy: 'updatedAt', // createdAt, updatedAt, title, size
            sortOrder: 'desc' // asc, desc
        };
    }

    /**
     * 获取默认统计数据
     */
    getDefaultStatistics() {
        return {
            totalDocuments: 0,
            totalWords: 0,
            totalReadingTime: 0, // 以分钟为单位
            documentsRead: 0,
            vocabularySize: 0,
            loginCount: 0,
            lastActivityAt: null,
            weeklyStats: {
                documentsRead: 0,
                wordsLearned: 0,
                readingTime: 0
            },
            monthlyStats: {
                documentsRead: 0,
                wordsLearned: 0,
                readingTime: 0
            }
        };
    }

    /**
     * 更新用户偏好设置
     */
    updatePreferences(newPreferences) {
        this.preferences = { ...this.preferences, ...newPreferences };
        this.touch();
    }

    /**
     * 更新统计数据
     */
    updateStatistics(newStats) {
        this.statistics = { ...this.statistics, ...newStats };
        this.touch();
    }

    /**
     * 记录登录
     */
    recordLogin() {
        this.lastLoginAt = new Date().toISOString();
        this.statistics.loginCount += 1;
        this.statistics.lastActivityAt = this.lastLoginAt;
        this.touch();
    }

    /**
     * 记录阅读活动
     */
    recordReadingActivity(duration = 0) {
        this.statistics.totalReadingTime += duration;
        this.statistics.lastActivityAt = new Date().toISOString();
        this.touch();
    }

    /**
     * 增加文档计数
     */
    incrementDocumentCount() {
        this.statistics.totalDocuments += 1;
        this.touch();
    }

    /**
     * 减少文档计数
     */
    decrementDocumentCount() {
        if (this.statistics.totalDocuments > 0) {
            this.statistics.totalDocuments -= 1;
            this.touch();
        }
    }

    /**
     * 增加词汇量
     */
    incrementVocabularySize(count = 1) {
        this.statistics.vocabularySize += count;
        this.touch();
    }

    /**
     * 验证用户数据
     */
    validate() {
        super.validate();
        
        if (this.email && !this.isValidEmail(this.email)) {
            throw new Error('邮箱格式不正确');
        }
        
        if (!this.displayName || this.displayName.trim().length === 0) {
            throw new Error('显示名称不能为空');
        }
        
        return true;
    }

    /**
     * 验证邮箱格式
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * 获取用户显示信息
     */
    getDisplayInfo() {
        return {
            id: this.id,
            displayName: this.displayName,
            avatar: this.avatar,
            isActive: this.isActive
        };
    }
}

// 导出到全局
window.UserModel = UserModel;
