/**
 * 文档数据模型
 * 管理文档的基本信息和内容
 */

class DocumentModel extends BaseModel {
    constructor(data = {}) {
        super(data);
        this.title = data.title || '';
        this.content = data.content || '';
        this.language = data.language || 'English';
        this.tags = data.tags || [];
        this.wordCount = data.wordCount || 0;
        this.characterCount = data.characterCount || 0;
        this.readingProgress = data.readingProgress || 0; // 0-100 百分比
        this.lastReadAt = data.lastReadAt || null;
        this.readingTime = data.readingTime || 0; // 阅读时间（分钟）
        this.difficulty = data.difficulty || 'medium'; // easy, medium, hard
        this.status = data.status || 'active'; // active, archived, deleted
        this.folderPath = data.folderPath || ''; // 所属文件夹路径
        this.metadata = data.metadata || {};
        this.vocabulary = data.vocabulary || []; // 关联的词汇列表
        this.notes = data.notes || []; // 笔记列表
        this.bookmarks = data.bookmarks || []; // 书签列表
    }

    /**
     * 更新文档内容
     */
    updateContent(newContent) {
        this.content = newContent;
        this.updateWordCount();
        this.touch();
    }

    /**
     * 更新文档标题
     */
    updateTitle(newTitle) {
        if (!newTitle || newTitle.trim().length === 0) {
            throw new Error('文档标题不能为空');
        }
        this.title = newTitle.trim();
        this.touch();
    }

    /**
     * 更新字数统计
     */
    updateWordCount() {
        // 简单的词数统计
        const words = this.content.trim().split(/\s+/).filter(word => word.length > 0);
        this.wordCount = words.length;
        this.characterCount = this.content.length;
        this.touch();
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
     * 更新阅读进度
     */
    updateReadingProgress(progress) {
        if (progress >= 0 && progress <= 100) {
            this.readingProgress = progress;
            this.lastReadAt = new Date().toISOString();
            this.touch();
        }
    }

    /**
     * 记录阅读时间
     */
    addReadingTime(minutes) {
        if (minutes > 0) {
            this.readingTime += minutes;
            this.lastReadAt = new Date().toISOString();
            this.touch();
        }
    }

    /**
     * 添加词汇
     */
    addVocabulary(word, definition = '', context = '') {
        const vocabularyItem = {
            id: this.generateId(),
            word: word.trim(),
            definition: definition.trim(),
            context: context.trim(),
            addedAt: new Date().toISOString(),
            reviewCount: 0,
            lastReviewAt: null,
            difficulty: 1 // 1-5 难度等级
        };

        // 检查是否已存在
        const existingIndex = this.vocabulary.findIndex(v => v.word.toLowerCase() === word.toLowerCase());
        if (existingIndex !== -1) {
            // 更新现有词汇
            this.vocabulary[existingIndex] = { ...this.vocabulary[existingIndex], ...vocabularyItem };
        } else {
            // 添加新词汇
            this.vocabulary.push(vocabularyItem);
        }
        
        this.touch();
    }

    /**
     * 移除词汇
     */
    removeVocabulary(wordId) {
        const index = this.vocabulary.findIndex(v => v.id === wordId);
        if (index !== -1) {
            this.vocabulary.splice(index, 1);
            this.touch();
        }
    }

    /**
     * 添加笔记
     */
    addNote(content, position = null) {
        const note = {
            id: this.generateId(),
            content: content.trim(),
            position: position, // 在文档中的位置
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.notes.push(note);
        this.touch();
        return note.id;
    }

    /**
     * 更新笔记
     */
    updateNote(noteId, newContent) {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            note.content = newContent.trim();
            note.updatedAt = new Date().toISOString();
            this.touch();
        }
    }

    /**
     * 删除笔记
     */
    deleteNote(noteId) {
        const index = this.notes.findIndex(n => n.id === noteId);
        if (index !== -1) {
            this.notes.splice(index, 1);
            this.touch();
        }
    }

    /**
     * 添加书签
     */
    addBookmark(position, title = '') {
        const bookmark = {
            id: this.generateId(),
            position: position,
            title: title.trim() || `书签 ${this.bookmarks.length + 1}`,
            createdAt: new Date().toISOString()
        };
        
        this.bookmarks.push(bookmark);
        this.touch();
        return bookmark.id;
    }

    /**
     * 删除书签
     */
    deleteBookmark(bookmarkId) {
        const index = this.bookmarks.findIndex(b => b.id === bookmarkId);
        if (index !== -1) {
            this.bookmarks.splice(index, 1);
            this.touch();
        }
    }

    /**
     * 归档文档
     */
    archive() {
        this.status = 'archived';
        this.touch();
    }

    /**
     * 恢复文档
     */
    restore() {
        this.status = 'active';
        this.touch();
    }

    /**
     * 标记为删除
     */
    markAsDeleted() {
        this.status = 'deleted';
        this.touch();
    }

    /**
     * 设置文件夹路径
     */
    setFolderPath(folderPath) {
        this.folderPath = folderPath || '';
        this.touch();
    }

    /**
     * 验证文档数据
     */
    validate() {
        super.validate();
        
        if (!this.title || this.title.trim().length === 0) {
            throw new Error('文档标题不能为空');
        }
        
        if (this.readingProgress < 0 || this.readingProgress > 100) {
            throw new Error('阅读进度必须在0-100之间');
        }
        
        return true;
    }

    /**
     * 获取文档摘要信息
     */
    getSummary() {
        return {
            id: this.id,
            title: this.title,
            language: this.language,
            wordCount: this.wordCount,
            readingProgress: this.readingProgress,
            tags: this.tags.slice(),
            lastReadAt: this.lastReadAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            status: this.status,
            folderPath: this.folderPath
        };
    }

    /**
     * 获取学习统计
     */
    getLearningStats() {
        return {
            vocabularyCount: this.vocabulary.length,
            notesCount: this.notes.length,
            bookmarksCount: this.bookmarks.length,
            readingTime: this.readingTime,
            readingProgress: this.readingProgress,
            difficulty: this.difficulty
        };
    }
}

// 导出到全局
window.DocumentModel = DocumentModel;
