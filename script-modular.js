// ========================================
// WordWeb 单词学习应用 - 重构版本
// ========================================

// ==================== 应用配置 ====================
const CONFIG = {
    storage: {
        documents: 'documents',
        vocabulary: 'vocabulary', 
        settings: 'settings'
    },
    defaults: {
        fontSize: 18,
        theme: 'light',
        appLanguage: 'zh',
        defaultDocLang: 'English'
    }
};

// ==================== 应用状态管理 ====================
class AppState {    constructor() {
        this.documents = JSON.parse(localStorage.getItem(CONFIG.storage.documents)) || [];
        this.vocabulary = JSON.parse(localStorage.getItem(CONFIG.storage.vocabulary)) || [];
        this.settings = JSON.parse(localStorage.getItem(CONFIG.storage.settings)) || CONFIG.defaults;
        this.currentDocument = null;
        this.currentFontSize = CONFIG.defaults.fontSize;
        this.isDualColumnLayout = false;        this.currentPage = 0;
        this.totalPages = 1;
        this.textWidth = 80; // 文本宽度百分比
        this.isSelectionModeActive = false; // 选择模式状态
        this.selectedDocuments = []; // 选中的文档ID
        this.editingDocId = null; // 正在编辑的文档ID
        this.libraryViewMode = 'grid'; // 书库视图模式：'grid' 或 'list'
    }

    saveDocuments() {
        localStorage.setItem(CONFIG.storage.documents, JSON.stringify(this.documents));
    }

    saveVocabulary() {
        localStorage.setItem(CONFIG.storage.vocabulary, JSON.stringify(this.vocabulary));
    }

    saveSettings() {
        localStorage.setItem(CONFIG.storage.settings, JSON.stringify(this.settings));
    }
}

// ==================== 文档管理模块 ====================
class DocumentManager {
    constructor(state) {
        this.state = state;
    }    createDocument(title, language, tags, content) {
        const newDoc = {
            id: Date.now().toString(),
            title: title.trim(),
            language: language.trim(),
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],            
            content: content.trim(),
            createdAt: new Date().toISOString(),
            lastReadAt: null,
            readingProgress: 0,
            highlightedWords: [],
            cardColor: 'default'
        };

        this.state.documents.push(newDoc);
        this.state.saveDocuments();
        
        // 如果有文件夹管理器，将文档添加到当前路径
        if (window.app && window.app.folderManager) {
            window.app.folderManager.addDocumentToFolder(newDoc.id, window.app.folderManager.currentPath);
        }
        
        return newDoc;
    }

    getDocument(id) {
        return this.state.documents.find(doc => doc.id === id);
    }    deleteDocument(id) {
        // 如果有文件夹管理器，从所有文件夹中移除该文档
        if (window.app && window.app.folderManager) {
            // 遍历所有文件夹路径，移除该文档
            for (const [path, docIds] of window.app.folderManager.documents) {
                window.app.folderManager.removeDocumentFromFolder(id, path);
            }
        }
        
        this.state.documents = this.state.documents.filter(doc => doc.id !== id);
        this.state.saveDocuments();
    }

    updateDocument(id, data) {
        const doc = this.getDocument(id);
        if (doc) {
            Object.assign(doc, data);
            this.state.saveDocuments();
        }
        return doc;
    }
}

// ==================== 生词本管理模块 ====================
class VocabularyManager {
    constructor(state) {
        this.state = state;
    }

    addWord(word, sourceDocument) {
        const existingWord = this.state.vocabulary.find(v => 
            v.word.toLowerCase() === word.toLowerCase()
        );

        if (!existingWord) {
            const newWord = {
                word: word,
                meaning: '正在查询释义...',
                addedDate: new Date().toISOString(),
                reviewCount: 0,
                nextReviewDate: this.getNextReviewDate(0),
                sourceDocument: sourceDocument || 'Unknown'
            };

            this.state.vocabulary.push(newWord);
            this.getWordMeaning(word).then(meaning => {
                newWord.meaning = meaning;
                this.state.saveVocabulary();
            });
        }

        this.state.saveVocabulary();
    }

    removeWord(word) {
        this.state.vocabulary = this.state.vocabulary.filter(v => 
            v.word.toLowerCase() !== word.toLowerCase()
        );
        this.state.saveVocabulary();
    }

    async getWordMeaning(word) {
        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            
            if (!response.ok) {
                return `释义查询失败，请手动查询 "${word}"`;
            }
            
            const data = await response.json();
            const entry = data[0];
            
            let meaning = '';
            
            if (entry.meanings && entry.meanings.length > 0) {
                const firstMeaning = entry.meanings[0];
                meaning = `[${firstMeaning.partOfSpeech}] ${firstMeaning.definitions[0].definition}`;
            }
            
            return meaning || `未找到 "${word}" 的释义`;
        } catch (error) {
            console.error('获取单词释义失败:', error);
            return `网络错误，无法获取 "${word}" 的释义`;
        }
    }

    getNextReviewDate(reviewCount) {
        const now = new Date();
        let daysToAdd;
        
        switch (reviewCount) {
            case 0: daysToAdd = 1; break;
            case 1: daysToAdd = 3; break;
            case 2: daysToAdd = 7; break;
            case 3: daysToAdd = 15; break;
            case 4: daysToAdd = 30; break;
            default: daysToAdd = 60; break;
        }
        
        now.setDate(now.getDate() + daysToAdd);
        return now.toISOString();
    }
}

// ==================== 阅读器模块 ====================
class ReaderManager {    constructor(state, vocabularyManager) {
        this.state = state;
        this.vocabularyManager = vocabularyManager;
        this.contentPages = [];
        this.splitTimeout = null; // 防抖定时器
        this.resizeTimeout = null; // 窗口大小调整防抖
        this.fontSizeTimeout = null; // 字体大小调整防抖
        
        // 优化的窗口大小变化监听
        this.handleResize = () => {
            if (!this.state.isDualColumnLayout || !this.state.currentDocument) return;
            
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }
            
            this.resizeTimeout = setTimeout(() => {
                this.splitContentIntoPages(this.state.currentDocument);
            }, 200); // 200ms防抖
        };
        
        window.addEventListener('resize', this.handleResize);
    }openDocument(doc) {
        this.state.currentDocument = doc;
        this.state.currentPage = 0;
        
        // 更新最后阅读时间
        doc.lastReadAt = new Date().toISOString();
        this.state.saveDocuments();
        
        this.renderDocument();
        
        // 确保布局按钮状态正确
        setTimeout(() => {
            if (window.app && window.app.uiManager) {
                window.app.uiManager.updateLayoutButtonStates();
            }
        }, 100);

        // 设置键盘事件监听（翻页导航）
        this.setupKeyboardNavigation();
    }

    setupKeyboardNavigation() {
        // 移除之前的事件监听器（如果存在）
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
        }

        // 创建新的键盘事件处理器
        this.keyboardHandler = (e) => {
            // 只在翻页模式且当前文档存在时响应
            if (!this.state.isDualColumnLayout || !this.state.currentDocument) return;
            
            // 检查是否在输入框中，如果是则不处理
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.prevPage();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextPage();
                    break;
                case ' ': // 空格键翻页
                    if (!e.shiftKey) {
                        e.preventDefault();
                        this.nextPage();
                    } else {
                        e.preventDefault();
                        this.prevPage();
                    }
                    break;
            }
        };

        document.addEventListener('keydown', this.keyboardHandler);
    }

    renderDocument() {
        const doc = this.state.currentDocument;
        if (!doc) return;

        document.getElementById('reader-title').textContent = doc.title;
        
        if (this.state.isDualColumnLayout) {
            this.renderPaginatedContent(doc);
        } else {
            this.renderScrollableContent(doc);
        }
    }    renderScrollableContent(doc) {
        const contentArea = document.getElementById('reader-content');
        const contentAreaContainer = document.getElementById('reader-content-area');
        const processedContent = this.processTextForInteraction(doc.content, doc.highlightedWords);
        contentArea.innerHTML = processedContent;
        contentArea.classList.remove('dual-column-layout');
        contentAreaContainer.classList.remove('paging-mode');
        
        // 清除分页模式的样式
        contentArea.style.height = '';
        contentArea.style.overflow = '';
        contentArea.style.columnCount = '';
        contentArea.style.webkitColumnCount = '';
        contentArea.style.mozColumnCount = '';
        contentArea.style.columnFill = '';
        contentArea.style.columnGap = '';
        
        document.getElementById('page-controls').style.display = 'none';
        document.getElementById('floating-page-controls').style.display = 'none';
        this.removeFloatingControlsEvents();
    }renderPaginatedContent(doc) {
        const contentArea = document.getElementById('reader-content');
        const contentAreaContainer = document.getElementById('reader-content-area');
        
        // 清除之前的样式，确保重新计算
        contentArea.style.columnCount = '';
        contentArea.style.webkitColumnCount = '';
        contentArea.style.mozColumnCount = '';
        
        // 动态计算最佳栏数（根据容器宽度）
        const containerWidth = contentAreaContainer.clientWidth;
        const minColumnWidth = 300; // 每栏最小宽度
        const maxColumns = 2; // 最大栏数限制
        const optimalColumns = Math.min(maxColumns, Math.max(1, Math.floor(containerWidth / minColumnWidth)));
        
        // 强制设置栏数，避免溢出
        contentArea.style.columnCount = optimalColumns.toString();
        contentArea.style.webkitColumnCount = optimalColumns.toString();
        contentArea.style.mozColumnCount = optimalColumns.toString();
        contentArea.style.columnFill = 'auto';
        contentArea.style.columnGap = '2rem';
        
        // 关键：设置固定高度以启用分页
        const containerHeight = contentAreaContainer.clientHeight;
        const contentPadding = 4 * 16; // 4rem padding
        const availableHeight = containerHeight - contentPadding;
        contentArea.style.height = `${availableHeight}px`;
        contentArea.style.overflow = 'hidden';
        
        contentArea.classList.add('dual-column-layout');
        contentAreaContainer.classList.add('paging-mode');
        
        this.splitContentIntoPages(doc);
        this.showPage(this.state.currentPage, false);
        document.getElementById('page-controls').style.display = 'none';
        document.getElementById('floating-page-controls').style.display = 'block';
        this.updatePageIndicator();
        this.setupFloatingControlsEvents();
    }splitContentIntoPages(doc) {
        const contentArea = document.getElementById('reader-content');
        const contentAreaContainer = document.getElementById('reader-content-area');
        
        if (!contentArea || !contentAreaContainer) {
            this.contentPages = [doc.content];
            this.state.totalPages = 1;
            return;
        }

        // 防抖处理，避免频繁重计算
        if (this.splitTimeout) {
            clearTimeout(this.splitTimeout);
        }
        
        this.splitTimeout = setTimeout(() => {
            this.performSplitContentIntoPages(doc, contentArea, contentAreaContainer);
        }, 100);
    }    performSplitContentIntoPages(doc, contentArea, contentAreaContainer) {
        const containerHeight = contentAreaContainer.clientHeight;
        const contentPadding = 4 * 16; // 4rem padding
        const availableHeight = containerHeight - contentPadding;
        
        console.log('容器尺寸:', {
            containerHeight,
            availableHeight,
            contentAreaWidth: contentAreaContainer.clientWidth
        });
        
        if (availableHeight <= 200) {
            this.contentPages = [doc.content];
            this.state.totalPages = 1;
            this.showPage(0, false);
            return;
        }

        const words = doc.content.split(/\s+/);
        
        // 只有很小的文档才直接显示（减少阈值）
        if (words.length <= 50) {
            this.contentPages = [doc.content];
            this.state.totalPages = 1;
            this.showPage(0, false);
            return;
        }

        // 使用更准确的分页方法
        const pages = this.createPagesWithRealMeasurement(doc, words, contentArea, availableHeight);

        this.contentPages = pages.length > 0 ? pages : [doc.content];
        this.state.totalPages = this.contentPages.length;
        
        console.log(`分页完成，总页数: ${this.state.totalPages}, 原文档词数: ${words.length}`);

        // 确保当前页面索引有效
        if (this.state.currentPage >= this.state.totalPages) {
            this.state.currentPage = Math.max(0, this.state.totalPages - 1);
        }

        this.showPage(this.state.currentPage, false);
    }

    createPagesWithRealMeasurement(doc, words, contentArea, availableHeight) {
        const pages = [];
        let currentIndex = 0;
        
        // 创建测试容器
        const testContainer = document.createElement('div');
        const containerStyles = window.getComputedStyle(contentArea);
        testContainer.style.cssText = `
            position: absolute;
            visibility: hidden;
            top: -9999px;
            left: -9999px;
            width: ${contentArea.clientWidth}px;
            height: ${availableHeight}px;
            column-count: ${contentArea.style.columnCount};
            column-gap: ${contentArea.style.columnGap};
            column-fill: auto;
            font-size: ${this.state.currentFontSize}px;
            line-height: 1.8;
            text-align: justify;
            word-wrap: break-word;
            overflow: hidden;
            padding: 2rem;
            box-sizing: border-box;
        `;
        document.body.appendChild(testContainer);
        
        try {
            while (currentIndex < words.length) {
                // 二分查找最佳页面大小
                let left = 10;
                let right = Math.min(300, words.length - currentIndex);
                let bestFit = left;
                
                while (left <= right) {
                    const mid = Math.floor((left + right) / 2);
                    const testWords = words.slice(currentIndex, currentIndex + mid);
                    const testContent = this.processTextForInteraction(testWords.join(' '), doc.highlightedWords);
                    
                    testContainer.innerHTML = testContent;
                    
                    if (testContainer.scrollHeight <= availableHeight + 5) { // 5px容差
                        bestFit = mid;
                        left = mid + 1;
                    } else {
                        right = mid - 1;
                    }
                }
                
                // 确保至少有一些内容
                if (bestFit === 0) {
                    bestFit = Math.min(20, words.length - currentIndex);
                }
                
                const pageWords = words.slice(currentIndex, currentIndex + bestFit);
                pages.push(pageWords.join(' '));
                currentIndex += bestFit;
                
                console.log(`页面 ${pages.length}: ${bestFit} 词`);
                
                // 防止无限循环
                if (bestFit === 0) break;
            }
        } finally {
            document.body.removeChild(testContainer);
        }
        
        return pages;
    }estimateWordsPerPage(container, availableHeight) {
        // 根据容器宽度和字体大小估算每页单词数
        const containerWidth = container.clientWidth;
        const fontSize = this.state.currentFontSize;
        const lineHeight = fontSize * 1.8;
        const linesPerPage = Math.floor(availableHeight / lineHeight);
        
        // 计算每行平均单词数（考虑栏数）
        const columnCount = Math.min(2, Math.max(1, Math.floor(containerWidth / 300)));
        const columnWidth = (containerWidth - 64) / columnCount; // 减去padding和gap
        const avgWordsPerLine = Math.floor(columnWidth / (fontSize * 0.6)); // 估算单词宽度
        
        // 保守估算，确保分页效果
        const estimatedWords = Math.floor(linesPerPage * avgWordsPerLine * columnCount * 0.7); // 使用70%的容量确保分页
        
        console.log('分页参数:', {
            containerWidth,
            availableHeight,
            fontSize,
            lineHeight,
            linesPerPage,
            columnCount,
            columnWidth,
            avgWordsPerLine,
            estimatedWords
        });
        
        return Math.max(80, Math.min(estimatedWords, 300)); // 最小80词，最大300词每页
    }showPage(pageIndex, animated = true) {
        if (pageIndex < 0 || pageIndex >= this.contentPages.length) return;
        const contentArea = document.getElementById('reader-content');
        const doc = this.state.currentDocument;
        const pageContent = this.contentPages[pageIndex];
        const processedContent = this.processTextForInteraction(pageContent, doc.highlightedWords);
        
        if (contentArea) {
            if (animated) {
                // 添加淡入淡出动画
                contentArea.classList.add('fade-out');
                setTimeout(() => {
                    contentArea.innerHTML = processedContent;
                    contentArea.classList.remove('fade-out');
                    contentArea.classList.add('fade-in');
                    setTimeout(() => contentArea.classList.remove('fade-in'), 250);
                }, 200);
            } else {
                // 直接更新内容，无动画
                contentArea.innerHTML = processedContent;
            }
        }
        this.state.currentPage = pageIndex;
        this.updatePageIndicator();
    }

    processTextForInteraction(content, highlightedWords) {
        return content.replace(/\b[a-zA-Z]{3,}\b/g, (word) => {
            const isHighlighted = highlightedWords.includes(word.toLowerCase());
            const className = isHighlighted ? 'highlighted-word' : 'clickable-word';
            return `<span class="${className}" onclick="app.toggleWordHighlight('${word}')">${word}</span>`;
        });
    }    toggleWordHighlight(word) {
        if (!this.state.currentDocument) return;
        
        const doc = this.state.currentDocument;
        const wordLower = word.toLowerCase();
        const index = doc.highlightedWords.indexOf(wordLower);
        
        if (index > -1) {
            doc.highlightedWords.splice(index, 1);
            this.vocabularyManager.removeWord(word);
        } else {
            doc.highlightedWords.push(wordLower);
            this.vocabularyManager.addWord(word, doc.title);
        }
        
        this.state.saveDocuments();
        
        // 优化：根据当前布局模式选择更新方式
        if (this.state.isDualColumnLayout) {
            // 翻页模式：直接更新当前页面，无动画
            this.showPage(this.state.currentPage, false);
        } else {
            // 垂直模式：重新渲染整个文档
            this.renderDocument();
        }
    }    toggleLayout() {
        this.state.isDualColumnLayout = !this.state.isDualColumnLayout;
        const toggleBtn = document.getElementById('layout-toggle-btn');
        const controlsPanel = document.getElementById('reader-controls-panel');
        
        if (this.state.isDualColumnLayout) {
            if (toggleBtn) {
                toggleBtn.textContent = '单栏';
                toggleBtn.classList.add('active');
            }
            if (controlsPanel) {
                controlsPanel.classList.add('dual-column-active');
            }
            // 设置翻页模式的键盘导航
            this.setupKeyboardNavigation();
        } else {
            if (toggleBtn) {
                toggleBtn.textContent = '双栏';
                toggleBtn.classList.remove('active');
            }
            if (controlsPanel) {
                controlsPanel.classList.remove('dual-column-active');
            }
            // 移除翻页模式的键盘导航
            this.removeKeyboardNavigation();
        }
        
        this.renderDocument();
        
        // 更新布局按钮状态
        if (window.app && window.app.uiManager) {
            window.app.uiManager.updateLayoutButtonStates();
        }
    }

    removeKeyboardNavigation() {
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
            this.keyboardHandler = null;
        }
    }    changeFontSize(delta) {
        this.state.currentFontSize += delta;
        this.state.currentFontSize = Math.max(12, Math.min(36, this.state.currentFontSize));
        
        document.getElementById('reader-content').style.fontSize = `${this.state.currentFontSize}px`;
        document.getElementById('font-size-display').textContent = `${this.state.currentFontSize}px`;

        // 优化重新分页 - 只在双栏模式下且有文档时进行
        if (this.state.isDualColumnLayout && this.state.currentDocument) {
            // 防抖处理，避免连续调整字体大小时频繁重计算
            if (this.fontSizeTimeout) {
                clearTimeout(this.fontSizeTimeout);
            }
            this.fontSizeTimeout = setTimeout(() => {
                this.splitContentIntoPages(this.state.currentDocument);
            }, 300);
        }
    }

    changeTheme(theme) {
        const contentArea = document.getElementById('reader-content-area');
        contentArea.classList.remove('theme-light', 'theme-sepia', 'theme-dark');
        contentArea.classList.add(`theme-${theme}`);
    }

    nextPage() {
        if (this.state.currentPage < this.state.totalPages - 1) {
            this.showPage(this.state.currentPage + 1);
        }
    }

    prevPage() {
        if (this.state.currentPage > 0) {
            this.showPage(this.state.currentPage - 1);
        }
    }    updatePageIndicator() {
        // 更新页面指示器文本
        const pageIndicator = document.getElementById('page-indicator');
        if (pageIndicator) {
            pageIndicator.textContent = `${this.state.currentPage + 1} / ${this.state.totalPages}`;
        }
        
        // 更新翻页按钮状态
        const prevPageBtn = document.getElementById('prev-page');
        const nextPageBtn = document.getElementById('next-page');
        
        if (prevPageBtn) {
            prevPageBtn.disabled = this.state.currentPage === 0;
        }
        if (nextPageBtn) {
            nextPageBtn.disabled = this.state.currentPage === this.state.totalPages - 1;
        }
    }    setupFloatingControlsEvents() {
        const contentArea = document.getElementById('reader-content-area');
        const floatingControls = document.getElementById('floating-page-controls');
        
        if (!contentArea || !floatingControls) return;

        // 初次加载时短暂显示控件提示用户
        setTimeout(() => {
            floatingControls.classList.add('show-controls');
            setTimeout(() => {
                floatingControls.classList.remove('show-controls');
            }, 2000); // 2秒后隐藏
        }, 500);        // 鼠标移动事件处理
        this.handleFloatingControlsVisibility = (e) => {
            const rect = contentArea.getBoundingClientRect();
            let x;
            
            // 支持触摸和鼠标事件
            if (e.type === 'touchstart' || e.type === 'touchmove') {
                if (e.touches && e.touches.length > 0) {
                    x = e.touches[0].clientX - rect.left;
                }
            } else {
                x = e.clientX - rect.left;
            }
            
            if (x === undefined) return;
            
            const width = rect.width;
            
            // 检测鼠标是否靠近左右边缘 (距离边缘150px内显示)
            const threshold = 150;
            const isNearLeftEdge = x < threshold;
            const isNearRightEdge = x > width - threshold;
            
            if (isNearLeftEdge || isNearRightEdge) {
                floatingControls.classList.add('show-controls');
                // 重置隐藏定时器
                this.clearFloatingControlsTimer();
                this.floatingControlsTimer = setTimeout(() => {
                    floatingControls.classList.remove('show-controls');
                }, 3000); // 3秒后自动隐藏
            } else {
                this.clearFloatingControlsTimer();
                floatingControls.classList.remove('show-controls');
            }
        };

        // 鼠标离开内容区域时隐藏控件
        this.handleFloatingControlsLeave = () => {
            this.clearFloatingControlsTimer();
            this.floatingControlsTimer = setTimeout(() => {
                floatingControls.classList.remove('show-controls');
            }, 500);
        };

        // 鼠标进入控件区域时保持显示
        this.handleFloatingControlsEnter = () => {
            this.clearFloatingControlsTimer();
            floatingControls.classList.add('show-controls');
        };        // 绑定事件
        contentArea.addEventListener('mousemove', this.handleFloatingControlsVisibility);
        contentArea.addEventListener('mouseleave', this.handleFloatingControlsLeave);
        floatingControls.addEventListener('mouseenter', this.handleFloatingControlsEnter);
        floatingControls.addEventListener('mouseleave', this.handleFloatingControlsLeave);
        
        // 触摸设备支持
        contentArea.addEventListener('touchstart', this.handleFloatingControlsVisibility);
        contentArea.addEventListener('touchmove', this.handleFloatingControlsVisibility);
    }    removeFloatingControlsEvents() {
        const contentArea = document.getElementById('reader-content-area');
        const floatingControls = document.getElementById('floating-page-controls');
        
        if (contentArea && this.handleFloatingControlsVisibility) {
            contentArea.removeEventListener('mousemove', this.handleFloatingControlsVisibility);
            contentArea.removeEventListener('mouseleave', this.handleFloatingControlsLeave);
            contentArea.removeEventListener('touchstart', this.handleFloatingControlsVisibility);
            contentArea.removeEventListener('touchmove', this.handleFloatingControlsVisibility);
        }
        
        if (floatingControls) {
            floatingControls.removeEventListener('mouseenter', this.handleFloatingControlsEnter);
            floatingControls.removeEventListener('mouseleave', this.handleFloatingControlsLeave);
        }
        
        this.clearFloatingControlsTimer();
    }

    clearFloatingControlsTimer() {
        if (this.floatingControlsTimer) {
            clearTimeout(this.floatingControlsTimer);
            this.floatingControlsTimer = null;
        }
    }    changeTextWidth(width) {
        this.state.textWidth = width;
        const contentArea = document.getElementById('reader-content');
        const contentAreaContainer = document.getElementById('reader-content-area');
        
        // 应用新的宽度限制到内容区域，而不是容器
        if (contentArea) {
            contentArea.style.maxWidth = `${width}rem`;
            // 确保内容始终居中
            contentArea.style.margin = '0 auto';
        }
        
        // 如果是双栏模式，需要重新分页和重新计算栏数
        if (this.state.isDualColumnLayout && this.state.currentDocument) {
            // 延迟重新分页，确保样式更新完成
            setTimeout(() => {
                // 重新计算栏数
                const containerWidth = contentAreaContainer ? contentAreaContainer.clientWidth : 1000;
                const minColumnWidth = 300;
                const maxColumns = 2;
                const optimalColumns = Math.min(maxColumns, Math.max(1, Math.floor(containerWidth / minColumnWidth)));
                
                if (contentArea) {
                    contentArea.style.columnCount = optimalColumns.toString();
                    contentArea.style.webkitColumnCount = optimalColumns.toString();
                    contentArea.style.mozColumnCount = optimalColumns.toString();
                }
                
                // 重新分页
                this.splitContentIntoPages(this.state.currentDocument);
            }, 50);
        }
    }

    // 清理方法，释放资源
    destroy() {
        if (this.splitTimeout) {
            clearTimeout(this.splitTimeout);
            this.splitTimeout = null;
        }
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
        if (this.fontSizeTimeout) {
            clearTimeout(this.fontSizeTimeout);
            this.fontSizeTimeout = null;
        }
        if (this.handleResize) {
            window.removeEventListener('resize', this.handleResize);
        }
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
        }
        this.removeFloatingControlsEvents();
        this.clearFloatingControlsTimer();
    }
}

// ==================== UI 管理模块 ====================
class UIManager {
    constructor(state, documentManager, vocabularyManager, readerManager) {
        this.state = state;
        this.documentManager = documentManager;
        this.vocabularyManager = vocabularyManager;
        this.readerManager = readerManager;
        this.app = null; // 将在WordWebApp构造函数中设置
        this.setupEventListeners();
    }    setupEventListeners() {
        console.log('设置事件监听器...');        // 视图切换按钮
        const viewToggleBtn = document.getElementById('view-toggle-btn');
        if (viewToggleBtn) {
            viewToggleBtn.addEventListener('click', () => this.toggleLibraryView());
        }
        
        // 主题切换按钮
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                if (this.app && this.app.themeManager) {
                    this.app.themeManager.toggleTheme();
                }
            });
        }
        // 选择模式按钮
        const cancelBtn = document.getElementById('cancel-selection-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.exitSelectionMode());
        }
        const deleteSelectedBtn = document.getElementById('delete-selected-btn');
        if (deleteSelectedBtn) {
            deleteSelectedBtn.addEventListener('click', () => this.deleteSelectedDocuments());
        }
        // 导入相关 - 移除导入卡片相关代码，现在由添加菜单处理
        console.log('绑定导入相关事件...');
        
        const closeImportModalBtn = document.getElementById('close-import-modal');
        if (closeImportModalBtn) {
            closeImportModalBtn.addEventListener('click', () => this.closeImportModal());
        }
        // 导航相关
        /* 已移除悬浮按钮代码，现在使用顶部导航
        const vocabularyBtn = document.getElementById('vocabulary-btn');
        if (vocabularyBtn) {
            vocabularyBtn.addEventListener('click', () => this.switchView('vocabulary'));
        }
        const reviewBtn = document.getElementById('review-btn');
        if (reviewBtn) {
            reviewBtn.addEventListener('click', () => this.switchView('review'));
        }
        */
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openSettingsModal());
        }        const backToLibraryBtn = document.getElementById('back-to-library-btn');
        if (backToLibraryBtn) {
            backToLibraryBtn.addEventListener('click', () => {
                // 如果有文件夹导航历史，先尝试后退
                if (this.folderManager && this.folderManager.historyIndex > 0) {
                    this.folderManager.goBack();
                } else {
                    // 否则返回书库主视图
                    this.switchView('library');
                }
            });
        }
        const backToLibraryFromVocabBtn = document.getElementById('back-to-library-from-vocab-btn');
        if (backToLibraryFromVocabBtn) {
            backToLibraryFromVocabBtn.addEventListener('click', () => this.switchView('library'));
        }
        // 阅读器控制面板
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => this.readerManager.changeTheme(e.target.value));
        }
        const decreaseFontBtn = document.getElementById('decrease-font');
        if (decreaseFontBtn) {
            decreaseFontBtn.addEventListener('click', () => this.readerManager.changeFontSize(-2));
        }
        const increaseFontBtn = document.getElementById('increase-font');
        if (increaseFontBtn) {
            increaseFontBtn.addEventListener('click', () => this.readerManager.changeFontSize(2));
        }
        const layoutToggleBtn = document.getElementById('layout-toggle-btn');
        if (layoutToggleBtn) {
            layoutToggleBtn.addEventListener('click', () => this.readerManager.toggleLayout());
        }
        // 文本宽度控制
        const textWidthSlider = document.getElementById('text-width-slider');
        if (textWidthSlider) {
            textWidthSlider.addEventListener('input', (e) => {
                this.readerManager.changeTextWidth(parseInt(e.target.value));
            });
        }        // 翻页控制
        const prevPageBtn = document.getElementById('prev-page');
        if (prevPageBtn) {
            prevPageBtn.onclick = () => {
                // 颜色变化反馈
                prevPageBtn.classList.add('clicked');
                setTimeout(() => prevPageBtn.classList.remove('clicked'), 150);
                this.readerManager.prevPage();
            };
        }
        const nextPageBtn = document.getElementById('next-page');
        if (nextPageBtn) {
            nextPageBtn.onclick = () => {
                // 颜色变化反馈
                nextPageBtn.classList.add('clicked');
                setTimeout(() => nextPageBtn.classList.remove('clicked'), 150);
                this.readerManager.nextPage();
            };
        }
        // 设置相关
        const closeSettingsBtn = document.getElementById('close-settings-btn');
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => this.closeSettingsModal());
        }
        const saveSettingsBtn = document.getElementById('save-settings-btn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        }
        // 点击弹窗外部关闭
        const importModal = document.getElementById('import-modal');
        if (importModal) {
            importModal.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) this.closeImportModal();
            });
        }
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) this.closeSettingsModal();
            });
        }
        // 颜色选择事件
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => this.selectColor(e.target));
        });
        // 自定义颜色选择器
        const customColorTrigger = document.getElementById('custom-color-trigger');
        const customColorPicker = document.getElementById('custom-color-picker');
        if (customColorTrigger && customColorPicker) {
            customColorTrigger.addEventListener('click', () => {
                customColorPicker.click();
            });
            customColorPicker.addEventListener('change', (e) => {
                this.applyCustomColor(e.target.value);
            });        }
        // 点击外部关闭菜单 - 现在由context-menu.js处理
        // document.addEventListener('click', function(e) {
        //     if (!e.target.closest('.card-menu-btn') && !e.target.closest('.card-context-menu')) {
        //         if (window.app && typeof app.hideAllMenus === 'function') {
        //             app.hideAllMenus();
        //         }
        //     }
        // });// 阅读器布局切换按钮
        const verticalBtn = document.getElementById('layout-vertical-btn');
        const pagingBtn = document.getElementById('layout-paging-btn');
        if (verticalBtn && pagingBtn) {            verticalBtn.addEventListener('click', () => {
                // 切换到垂直布局（非双栏模式）
                if (this.readerManager.state.isDualColumnLayout) {
                    this.readerManager.toggleLayout();
                }
                this.updateLayoutButtonStates();
                // 按钮点击颜色反馈
                verticalBtn.classList.add('clicked');
                setTimeout(() => verticalBtn.classList.remove('clicked'), 150);
            });
            pagingBtn.addEventListener('click', () => {
                // 切换到翻页布局（双栏模式）
                if (!this.readerManager.state.isDualColumnLayout) {
                    this.readerManager.toggleLayout();
                }
                this.updateLayoutButtonStates();
                // 按钮点击颜色反馈
                pagingBtn.classList.add('clicked');
                setTimeout(() => pagingBtn.classList.remove('clicked'), 150);
            });
            // 初始化按钮状态
            this.updateLayoutButtonStates();
        }
    }    switchView(viewName) {
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active-view');
        });
        
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active-view');
            
            /* 移除悬浮按钮控制代码
            // 控制悬浮按钮显示
            const floatingActions = document.getElementById('floating-actions');
            if (floatingActions) {
                if (viewName === 'library') {
                    floatingActions.style.display = 'flex';
                } else {
                    floatingActions.style.display = 'none';
                }
            }
            */
            
            if (viewName === 'vocabulary') {
                this.renderVocabulary();
            } else if (viewName === 'library') {
                this.renderLibrary();
            }
        }
    }

    // 选择模式相关方法
    enterSelectionMode() {
        this.state.isSelectionModeActive = true;
        document.getElementById('selection-bar').classList.add('visible');
        document.getElementById('app-header').classList.add('hidden');
        this.updateSelectionBar();
    }    exitSelectionMode() {
        this.state.isSelectionModeActive = false;
        this.state.selectedDocuments = [];
        document.getElementById('selection-bar').classList.remove('visible');
        document.getElementById('app-header').classList.remove('hidden');
        this.renderLibrary(); // 重新渲染当前视图
    }

    toggleCardSelection(docId, cardElement) {
        const index = this.state.selectedDocuments.indexOf(docId);
        if (index > -1) {
            this.state.selectedDocuments.splice(index, 1);
            cardElement.classList.remove('selected');
        } else {
            this.state.selectedDocuments.push(docId);
            cardElement.classList.add('selected');
        }

        if (this.state.selectedDocuments.length === 0) {
            this.exitSelectionMode();
        } else {
            this.updateSelectionBar();
        }
    }

    updateSelectionBar() {
        const count = this.state.selectedDocuments.length;
        document.getElementById('selection-count').textContent = `已选择 ${count} 项`;
    }

    deleteSelectedDocuments() {
        if (confirm(`确定要删除选中的 ${this.state.selectedDocuments.length} 个项目吗？`)) {
            this.state.selectedDocuments.forEach(id => this.documentManager.deleteDocument(id));
            this.exitSelectionMode();
        }
    }    // 导入功能
    openImportModal() {
        // 使用 ModalManager 统一管理
        this.app.modalManager.openModal('import-modal');
        document.getElementById('doc-lang').value = this.state.settings.defaultDocLang;
    }    closeImportModal() {
        // 使用 ModalManager 统一管理
        this.app.modalManager.closeModal('import-modal');
        document.getElementById('import-form').reset();
        document.getElementById('doc-lang').value = this.state.settings.defaultDocLang;
        
        // 重置编辑状态
        this.editingDocId = null;
        
        // 重置模态框标题和按钮文字
        const modalTitle = document.querySelector('#import-modal h2');
        const submitBtn = document.querySelector('#import-form button[type="submit"]');
        if (modalTitle) modalTitle.textContent = '导入新文稿';
        if (submitBtn) submitBtn.textContent = '确认导入';
    }handleImportSubmit(e) {
        console.log('handleImportSubmit 被调用');
        e.preventDefault();
        
        const title = document.getElementById('doc-title').value.trim();
        const language = document.getElementById('doc-lang').value.trim();
        const tags = document.getElementById('doc-tags').value.trim();
        const content = document.getElementById('doc-content').value.trim();
        
        console.log('导入数据:', { title, language, tags, content });
        
        if (!title || !content) {
            alert('请填写标题和内容');
            return;
        }
        
        // 检查是否为编辑模式
        if (this.editingDocId) {
            // 编辑现有文档
            const doc = this.documentManager.getDocument(this.editingDocId);
            if (doc) {
                doc.title = title;
                doc.language = language;
                doc.tags = tags ? tags.split(',').map(tag => tag.trim()) : [];
                doc.content = content;
                this.state.saveDocuments();
                console.log('文档编辑完成');
            }
            this.editingDocId = null;
        } else {
            // 创建新文档
            this.documentManager.createDocument(title, language, tags, content);
            console.log('导入完成');
        }
        
        this.renderLibrary();
        this.closeImportModal();
    }// 设置功能
    openSettingsModal() {
        // 使用 ModalManager 统一管理
        this.app.modalManager.openModal('settings-modal');
        
        // 填充当前设置值
        document.getElementById('app-language').value = this.state.settings.appLanguage;
        document.getElementById('default-doc-lang').value = this.state.settings.defaultDocLang;
    }

    closeSettingsModal() {
        // 使用 ModalManager 统一管理
        this.app.modalManager.closeModal('settings-modal');
    }    saveSettings() {
        // 获取设置值
        const appLanguage = document.getElementById('app-language').value;
        const defaultDocLang = document.getElementById('default-doc-lang').value;
        
        // 更新设置
        this.state.settings.appLanguage = appLanguage;
        this.state.settings.defaultDocLang = defaultDocLang;
        
        // 保存设置
        this.state.saveSettings();
        
        // 关闭弹窗
        this.closeSettingsModal();
        
        // 应用设置
        this.applySettings();
        
        // 重新加载页面以完全应用新语言
        setTimeout(() => {
            window.location.reload();
        }, 300);
    }

    applySettings() {
        // 这里可以根据设置应用界面语言等
        console.log('设置已应用:', this.state.settings);
    }    // 渲染书库
    renderLibrary() {
        if (this.state.libraryViewMode === 'list') {
            this.renderLibraryList();
            return;
        }
        
        const libraryGrid = document.getElementById('library-grid');
        if (!libraryGrid) return;        // 清空现有内容
        libraryGrid.innerHTML = '';

        // 如果有文件夹管理器，获取当前路径的文件夹和文档
        if (this.app && this.app.folderManager) {
            const folders = this.app.folderManager.getFoldersInCurrentPath();
            const docIds = this.app.folderManager.getDocumentsInCurrentPath();
            
            // 渲染文件夹
            folders.forEach(folder => {
                this.app.folderManager.addFolderToView(folder, libraryGrid, null);
            });
            
            // 渲染当前路径下的文档
            const currentPathDocs = this.state.documents.filter(doc => docIds.includes(doc.id));
            currentPathDocs.forEach(doc => {
                const cardElement = this.createDocumentCard(doc);
                libraryGrid.appendChild(cardElement);
            });
        } else {
            // 旧版本：渲染所有文档
            this.state.documents.forEach(doc => {
                const cardElement = this.createDocumentCard(doc);
                libraryGrid.appendChild(cardElement);
            });
        }        // 移除导入卡片事件绑定代码，现在由添加菜单处理
    }// 创建文档卡片
    createDocumentCard(doc) {
        const card = document.createElement('div');
        card.className = 'document-card';
        card.setAttribute('data-doc-id', doc.id);
          // 应用卡片颜色
        if (doc.cardColor && doc.cardColor !== 'default') {
            if (doc.cardColor.startsWith('#')) {
                // 自定义颜色 - 使用CSS变量系统而不是直接设置背景色
                this.app.setCustomColorVariables(doc.id, doc.cardColor);
            } else {
                // 预设主题
                card.classList.add(`theme-${doc.cardColor}`);
            }
        }

        // 计算阅读进度和状态
        let readingProgressText = '';
        let statusClass = '';
        
        if (doc.readingProgress === 0) {
            readingProgressText = '✨ 新文稿';
            statusClass = 'status-new';
        } else if (doc.readingProgress < 0.1) {
            readingProgressText = '📖 开始阅读';
            statusClass = 'status-started';
        } else if (doc.readingProgress < 1) {
            readingProgressText = `📚 ${Math.round(doc.readingProgress * 100)}%`;
            statusClass = 'status-reading';
        } else {
            readingProgressText = '✅ 已完成';
            statusClass = 'status-completed';
        }
        
        // 格式化最后阅读时间
        const lastReadText = doc.lastReadAt ? this.formatLastReadTime(doc.lastReadAt) : (this.app && this.app.i18nManager ? this.app.i18nManager.t('neverRead') : '尚未阅读');

        // 格式化标签
        const tagsHtml = doc.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        
        // 获取文档图标
        const docIcon = this.getDocumentIcon(doc.language);
        
        // 格式化创建时间
        const createdDate = new Date(doc.createdAt).toLocaleDateString('zh-CN');

        card.innerHTML = `
            <div class="card-content">
                <h3>${this.escapeHtml(doc.title)}</h3>
                <div class="card-meta">
                    <div class="meta-item">
                        <span class="language-tag">${docIcon} ${doc.language}</span>
                    </div>
                    <div class="meta-item">
                        <svg class="meta-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                        </svg>
                        <span>${doc.content.split(' ').length} 词</span>
                    </div>
                    <div class="meta-item">
                        <svg class="meta-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9,10V12H7V10H9M13,10V12H11V10H13M17,10V12H15V10H15M19,3A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5A2,2 0 0,1 5,3H6V1H8V3H16V1H18V3H19M19,19V8H5V19H19M7,16V14H9V16H7M11,16V14H13V16H11M15,16V14H17V16H15Z"/>
                        </svg>
                        <span>${createdDate}</span>
                    </div>
                </div>
                ${tagsHtml ? `<div class="card-tags">${tagsHtml}</div>` : ''}
            </div>
            <div class="card-footer">
                <span class="last-read">${lastReadText}</span>
                <span class="reading-progress ${statusClass}">${readingProgressText}</span>
            </div>
            <button class="card-menu-btn" data-doc-id="${doc.id}" title="更多选项">⋮</button>        `;        // 添加点击事件
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('card-menu-btn')) {
                // 菜单按钮点击由context-menu.js处理
                return;
            }
            if (this.state.isSelectionModeActive) {
                this.toggleCardSelection(doc.id, card);
                return;
            }
            this.openDocument(doc.id);
        });

        return card;
    }

    // 打开卡片侧边栏
    openCardSidebar(docId) {
        if (this.app && this.app.sidebarManager) {
            this.app.sidebarManager.openSidebar(docId);
        }
    }

    // 打开文档阅读
    openDocument(docId) {
        const doc = this.documentManager.getDocument(docId);
        if (doc) {
            this.readerManager.openDocument(doc);
            this.switchView('reading');
        }
    }    // 格式化最后阅读时间
    formatLastReadTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        
        const i18n = this.app ? this.app.i18nManager : null;
        const isEn = i18n && i18n.currentLanguage === 'en';
        
        if (diffMinutes < 5) return i18n ? i18n.t('justRead') : '刚刚阅读';
        if (diffMinutes < 60) {
            return isEn ? `${diffMinutes} ${i18n.t('minutesAgo')}` : `${diffMinutes}${i18n ? i18n.t('minutesAgo') : '分钟前'}`;
        }
        if (diffHours < 24) {
            return isEn ? `${diffHours} ${i18n.t('hoursAgo')}` : `${diffHours}${i18n ? i18n.t('hoursAgo') : '小时前'}`;
        }
        if (diffDays === 0) return i18n ? i18n.t('todayRead') : '今天阅读';
        if (diffDays === 1) return i18n ? i18n.t('yesterdayRead') : '昨天阅读';
        if (diffDays < 7) {
            return isEn ? `${diffDays} ${i18n.t('daysAgo')}` : `${diffDays}${i18n ? i18n.t('daysAgo') : '天前阅读'}`;
        }
        if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return isEn ? `${weeks} ${i18n.t('weeksAgo')}` : `${weeks}${i18n ? i18n.t('weeksAgo') : '周前阅读'}`;
        }
        const dateStr = isEn ? date.toLocaleDateString('en-US') : date.toLocaleDateString('zh-CN');
        return isEn ? `Read on ${dateStr}` : `${dateStr} 阅读`;
    }

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }    // 渲染生词本
    renderVocabulary() {
        const vocabularyList = document.getElementById('vocabulary-list');
        if (!vocabularyList) return;

        vocabularyList.innerHTML = '';

        if (this.state.vocabulary.length === 0) {
            vocabularyList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-color-muted);">
                    <h3>生词本为空</h3>
                    <p>在阅读过程中点击单词可以添加到生词本</p>
                </div>
            `;
            return;
        }

        // 渲染生词列表
        this.state.vocabulary.forEach(wordEntry => {
            const wordElement = document.createElement('div');
            wordElement.className = 'vocabulary-item';
            wordElement.innerHTML = `
                <div class="word-info">
                    <h4>${this.escapeHtml(wordEntry.word)}</h4>
                    <p class="word-context">${this.escapeHtml(wordEntry.context)}</p>
                    <span class="word-date">添加于 ${this.formatLastReadTime(wordEntry.addedAt)}</span>
                </div>
                <button class="remove-word-btn" onclick="removeFromVocabulary('${wordEntry.word}')">×</button>
            `;
            vocabularyList.appendChild(wordElement);
        });
    }

    // 更新布局按钮状态
    updateLayoutButtonStates() {
        const verticalBtn = document.getElementById('layout-vertical-btn');
        const pagingBtn = document.getElementById('layout-paging-btn');
        
        if (verticalBtn && pagingBtn) {
            if (this.readerManager.state.isDualColumnLayout) {
                // 翻页模式激活
                pagingBtn.classList.add('active');
                verticalBtn.classList.remove('active');
            } else {
                // 垂直模式激活
                verticalBtn.classList.add('active');
                pagingBtn.classList.remove('active');
            }
        }
    }    // 切换书库视图模式
    toggleLibraryView() {
        const newMode = this.state.libraryViewMode === 'grid' ? 'list' : 'grid';
        this.switchLibraryView(newMode);
    }
      switchLibraryView(mode) {
        this.state.libraryViewMode = mode;
        const gridIcon = document.getElementById('grid-icon');
        const listIcon = document.getElementById('list-icon');
        const libraryGrid = document.getElementById('library-grid');
        const libraryList = document.getElementById('library-list');
        
        if (mode === 'grid') {
            // 显示网格视图，图标显示列表（表示点击可切换到列表）
            gridIcon.style.display = 'none';
            listIcon.style.display = 'block';
            libraryGrid.style.display = 'grid';
            libraryList.style.display = 'none';
            this.renderLibrary(); // 重新渲染网格视图
        } else {
            // 显示列表视图，图标显示网格（表示点击可切换到网格）
            listIcon.style.display = 'none';
            gridIcon.style.display = 'block';
            libraryGrid.style.display = 'none';
            libraryList.style.display = 'flex';
            this.renderLibraryList(); // 渲染列表视图
        }
    }    // 渲染列表视图
    renderLibraryList() {
        const libraryList = document.getElementById('library-list');
        if (!libraryList) return;

        // 保存导入项的HTML内容
        const importListItem = document.getElementById('import-list-item');
        const importListItemHTML = importListItem ? importListItem.outerHTML : '';

        // 清空现有内容
        libraryList.innerHTML = '';

        // 重新添加导入项
        if (importListItemHTML) {
            libraryList.innerHTML = importListItemHTML;
        }

        // 如果有文件夹管理器，获取当前路径的文件夹和文档
        if (this.app && this.app.folderManager) {
            const folders = this.app.folderManager.getFoldersInCurrentPath();
            const docIds = this.app.folderManager.getDocumentsInCurrentPath();
            
            // 渲染文件夹列表项
            folders.forEach(folder => {
                this.app.folderManager.addFolderToView(folder, null, libraryList);
            });
            
            // 渲染当前路径下的文档列表项
            const currentPathDocs = this.state.documents.filter(doc => docIds.includes(doc.id));
            currentPathDocs.forEach(doc => {
                const listItemElement = this.createDocumentListItem(doc);
                libraryList.appendChild(listItemElement);
            });
        } else {
            // 旧版本：渲染所有文档
            this.state.documents.forEach(doc => {
                const listItemElement = this.createDocumentListItem(doc);
                libraryList.appendChild(listItemElement);
            });
        }        // 重新绑定导入项的事件
        const newImportListItem = document.getElementById('import-list-item');
        if (newImportListItem) {
            newImportListItem.addEventListener('click', () => this.openImportModal());
        }
    }

    // 创建文档列表项
    createDocumentListItem(doc) {
        const listItem = document.createElement('div');
        listItem.className = 'document-list-item';
        listItem.setAttribute('data-doc-id', doc.id);
        
        // 应用卡片颜色
        if (doc.cardColor && doc.cardColor !== 'default') {
            if (doc.cardColor.startsWith('#')) {
                // 自定义颜色 - 使用CSS变量系统
                this.app.setCustomColorVariables(doc.id, doc.cardColor);
            } else {
                // 预设主题
                listItem.classList.add(`theme-${doc.cardColor}`);
            }
        }

        // 计算阅读进度和状态
        let readingProgressText = '';
        let statusClass = '';
        
        if (doc.readingProgress === 0) {
            readingProgressText = '✨ 新文稿';
            statusClass = 'status-new';
        } else if (doc.readingProgress < 0.1) {
            readingProgressText = '📖 开始阅读';
            statusClass = 'status-started';
        } else if (doc.readingProgress < 1) {
            readingProgressText = `📚 ${Math.round(doc.readingProgress * 100)}%`;
            statusClass = 'status-reading';
        } else {
            readingProgressText = '✅ 已完成';
            statusClass = 'status-completed';
        }
        
        // 格式化最后阅读时间
        const lastReadText = doc.lastReadAt ? 
            this.formatLastReadTime(doc.lastReadAt) : 
            (this.app && this.app.i18nManager ? this.app.i18nManager.t('neverRead') : '从未阅读');

        // 格式化标签
        const tagsHtml = doc.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

        // 文档类型图标
        const docIcon = this.getDocumentIcon(doc.language);
        
        // 格式化创建时间
        const createdDate = new Date(doc.createdAt).toLocaleDateString('zh-CN');

        // 使用与卡片相同的布局结构
        listItem.innerHTML = `
            <div class="list-card-content">
                <div class="list-card-header">
                    <h3 class="list-card-title">${this.escapeHtml(doc.title)}</h3>
                    <button class="list-item-menu-btn" data-doc-id="${doc.id}" title="更多选项">⋮</button>
                </div>
                <div class="list-card-meta">
                    <div class="meta-item">
                        <span class="language-tag">${docIcon} ${doc.language}</span>
                    </div>
                    <div class="meta-item">
                        <svg class="meta-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                        </svg>
                        <span>${doc.content.split(' ').length} 词</span>
                    </div>
                    <div class="meta-item">
                        <svg class="meta-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9,10V12H7V10H9M13,10V12H11V10H13M17,10V12H15V10H15M19,3A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5A2,2 0 0,1 5,3H6V1H8V3H16V1H18V3H19M19,19V8H5V19H19M7,16V14H9V16H7M11,16V14H13V16H11M15,16V14H17V16H15Z"/>
                        </svg>
                        <span>${createdDate}</span>
                    </div>
                </div>
                ${tagsHtml ? `<div class="list-card-tags">${tagsHtml}</div>` : ''}
            </div>
            <div class="list-card-footer">
                <span class="last-read">${lastReadText}</span>
                <span class="reading-progress ${statusClass}">${readingProgressText}</span>
            </div>
        `;

        // 添加点击事件
        listItem.addEventListener('click', (e) => {
            if (e.target.classList.contains('list-item-menu-btn')) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            if (this.state.isSelectionModeActive) {
                this.toggleCardSelection(doc.id, listItem);
                return;
            }
            this.openDocument(doc.id);
        });

        return listItem;
    }

    // 获取文档类型图标
    getDocumentIcon(language) {
        const iconMap = {
            'English': '🇺🇸',
            'French': '🇫🇷',
            'German': '🇩🇪',
            'Spanish': '🇪🇸',
            'Italian': '🇮🇹',
            'Japanese': '🇯🇵',
            'Korean': '🇰🇷',
            'Chinese': '🇨🇳',
            'Russian': '🇷🇺',
            'Arabic': '🇸🇦',
            'Portuguese': '🇵🇹',
            'Dutch': '🇳🇱'
        };
        return iconMap[language] || '📄';
    }    // 初始化视图状态
    initializeViewState() {
        const gridIcon = document.getElementById('grid-icon');
        const listIcon = document.getElementById('list-icon');
        const libraryGrid = document.getElementById('library-grid');
        const libraryList = document.getElementById('library-list');
        
        // 确保初始状态为网格视图，显示列表图标
        if (gridIcon && listIcon) {
            gridIcon.style.display = 'none';
            listIcon.style.display = 'block';
        }
        
        if (libraryGrid && libraryList) {
            libraryGrid.style.display = 'grid';
            libraryList.style.display = 'none';
        }
        
        this.state.libraryViewMode = 'grid';
    }
}

// ==================== 国际化文本 ====================
const I18N_TEXTS = {
    zh: {
        appTitle: '我的书库',
        vocabulary: '📚',
        review: '🔄',
        settings: '⚙️',
        importNewDoc: '导入新文稿',
        backToLibrary: '<',
        title: '标题',
        language: '语言',
        tags: '标签',
        content: '文本内容',
        confirmImport: '确认导入',
        appLanguage: '应用语言',
        defaultDocLang: '默认文档语言',
        saveSettings: '保存设置',
        confirmDelete: '确认删除',
        cancel: '取消',
        confirmDeleteTitle: '确定要删除这个文档吗？',
        confirmDeleteMessage: '删除后无法恢复，请谨慎操作。',
        rename: '重命名文档',
        confirmRename: '确认',
        justRead: '刚刚阅读',
        neverRead: '从未阅读',
        minutesAgo: '分钟前',
        hoursAgo: '小时前',
        daysAgo: '天前阅读',
        todayRead: '今天阅读',
        yesterdayRead: '昨天阅读',        weeksAgo: '周前阅读',
        unstarted: '未开始',
        words: '词',        switchView: '切换视图',
        switchTheme: '切换主题',
        newFolder: '新建文件夹',
        importFromText: '从文稿导入',
        importFromLink: '从链接导入',
        importFromFile: '从文件导入',
        addContent: '添加内容'
    },
    en: {
        appTitle: 'My Library',
        vocabulary: '📚',
        review: '🔄',
        settings: '⚙️',
        importNewDoc: 'Import New Document',
        backToLibrary: '<',
        title: 'Title',
        language: 'Language',
        tags: 'Tags',
        content: 'Text Content',
        confirmImport: 'Confirm Import',
        appLanguage: 'App Language',
        defaultDocLang: 'Default Document Language',
        saveSettings: 'Save Settings',
        confirmDelete: 'Confirm Delete',
        cancel: 'Cancel',
        confirmDeleteTitle: 'Are you sure you want to delete this document?',
        confirmDeleteMessage: 'This action cannot be undone.',
        rename: 'Rename Document',
        confirmRename: 'Confirm',
        justRead: 'Just read',
        neverRead: 'Never read',
        minutesAgo: 'minutes ago',
        hoursAgo: 'hours ago',
        daysAgo: 'days ago',
        todayRead: 'Read today',        yesterdayRead: 'Read yesterday',
        weeksAgo: 'weeks ago',
        unstarted: 'Unstarted',
        words: 'words',        switchView: 'Switch View',
        switchTheme: 'Switch Theme',
        newFolder: 'New Folder',
        importFromText: 'Import from Text',
        importFromLink: 'Import from Link',
        importFromFile: 'Import from File',
        addContent: 'Add Content'
    }
};

// ==================== 国际化管理器 ====================
class I18nManager {
    constructor() {
        this.currentLanguage = 'zh';
    }

    setLanguage(lang) {
        this.currentLanguage = lang;
        this.updateUI();
    }

    t(key) {
        return I18N_TEXTS[this.currentLanguage][key] || key;
    }    updateUI() {        // 更新所有需要国际化的元素
        const elementsToUpdate = [
            { selector: '#library-view h1', key: 'appTitle' },
            { selector: '#vocabulary-btn', key: 'vocabulary', useHTML: true },
            { selector: '#review-btn', key: 'review', useHTML: true },
            { selector: 'label[for="doc-title"]', key: 'title' },
            { selector: 'label[for="doc-lang"]', key: 'language' },
            { selector: 'label[for="doc-tags"]', key: 'tags' },
            { selector: 'label[for="doc-content"]', key: 'content' },
            { selector: '#import-form button[type="submit"]', key: 'confirmImport' },
            { selector: 'label[for="app-language"]', key: 'appLanguage' },
            { selector: 'label[for="default-doc-lang"]', key: 'defaultDocLang' },
            { selector: '#save-settings-btn', key: 'saveSettings' },
            { selector: '.confirm-title', key: 'confirmDeleteTitle' },
            { selector: '.confirm-message', key: 'confirmDeleteMessage' },            { selector: '#cancel-delete-btn', key: 'cancel' },
            { selector: '#confirm-delete-btn', key: 'confirmDelete' },            { selector: '#rename-modal h2', key: 'rename' },
            { selector: '#confirm-rename-btn', key: 'confirmRename' },
            { selector: '[data-i18n="newFolder"]', key: 'newFolder' },
            { selector: '[data-i18n="importFromText"]', key: 'importFromText' },
            { selector: '[data-i18n="importFromLink"]', key: 'importFromLink' },
            { selector: '[data-i18n="importFromFile"]', key: 'importFromFile' },
            { selector: '#view-toggle-btn', key: 'switchView', attr: 'title' },
            { selector: '#theme-toggle-btn', key: 'switchTheme', attr: 'title' },
            { selector: '#add-menu-btn', key: 'addContent', attr: 'title' }
        ];elementsToUpdate.forEach(({ selector, key, attr, useHTML }) => {
            const element = document.querySelector(selector);
            if (element) {
                if (attr === 'title') {
                    element.setAttribute('title', this.t(key));
                } else if (useHTML) {
                    // 跳过设置按钮和返回按钮，它们在后面特殊处理
                    if (selector !== '#settings-btn' && selector !== '#back-to-library-btn') {
                        element.innerHTML = this.t(key);
                    }
                } else {
                    element.textContent = this.t(key);
                }
            }
        });

        // 特殊处理设置按钮，使用SVG图标
        const settingsBtn = document.querySelector('#settings-btn');
        if (settingsBtn) {
            settingsBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.65 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03  19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
                </svg>
            `;
        }

        // 特殊处理返回按钮，使用简洁的 < 符号
        const backBtn = document.querySelector('#back-to-library-btn');
        if (backBtn) {
            backBtn.innerHTML = '<span style="font-size: 20px; font-weight: bold;">&lt;</span>';
        }

        // 更新模态弹窗标题
        const importModalTitle = document.querySelector('#import-modal h2');
        if (importModalTitle) importModalTitle.textContent = this.t('importNewDoc');

        const settingsModalTitle = document.querySelector('#settings-modal h2');
        if (settingsModalTitle) settingsModalTitle.textContent = this.t('settings');

        const confirmDeleteModalTitle = document.querySelector('#confirm-delete-modal h2');
        if (confirmDeleteModalTitle) confirmDeleteModalTitle.textContent = this.t('confirmDelete');

        // 更新HTML lang属性
        document.documentElement.lang = this.currentLanguage === 'zh' ? 'zh-CN' : 'en';
    }
}

// ==================== 主应用类 ====================
class WordWebApp {
    constructor() {
        this.state = new AppState();
        this.documentManager = new DocumentManager(this.state);
        this.vocabularyManager = new VocabularyManager(this.state);
               this.readerManager = new ReaderManager(this.state, this.vocabularyManager);
        this.uiManager = new UIManager(this.state, this.documentManager, this.vocabularyManager, this.readerManager);
        this.modalManager = new ModalManager(this);
        this.sidebarManager = new SidebarManager(this);
        this.i18nManager = new I18nManager();
        this.themeManager = new ThemeManager();
        
        // 确保FolderManager类存在
        if (typeof FolderManager !== 'function') {
            console.error('FolderManager 类未找到，检查脚本加载顺序');
            this.folderManager = null;
        } else {
            this.folderManager = new FolderManager();
        }
        
        // 设置应用引用
        this.uiManager.app = this;
        this.folderManager.app = this;
        
        // 动态美化文本宽度滑块
        document.addEventListener('DOMContentLoaded', () => {
            const slider = document.getElementById('text-width-slider');
            if (slider) {
                const updateSliderBg = () => {
                    const val = (slider.value - slider.min) / (slider.max - slider.min);
                    slider.style.background = `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${val*100}%, #e6e0f8 ${val*100}%, #e6e0f8 100%)`;
                };
                slider.addEventListener('input', updateSliderBg);
                updateSliderBg();
            }
        });
    }

    init() {
        console.log('app.init called');
        console.log('WordWeb 应用启动...');
        
        // 初始化文件夹管理器
        if (this.folderManager) {
            console.log('文件夹管理器已初始化');
        }
        
        // 初始化视图状态
        this.uiManager.initializeViewState();
        
        // 确保 DOM 元素存在后再绑定导入表单事件
        this.setupImportFormEvents();
        
        this.uiManager.renderLibrary();
        this.applySettings();
    }

    setupImportFormEvents() {
        // 延迟绑定导入表单事件，确保 DOM 元素已存在
        const importForm = document.getElementById('import-form');
        if (importForm) {
            console.log('在应用初始化时找到import-form，绑定submit事件');
            importForm.addEventListener('submit', (e) => {
                console.log('导入表单submit事件被触发');
                this.uiManager.handleImportSubmit(e);
            });
        } else {
            console.error('应用初始化时未找到import-form元素！');
        }
    }

    applySettings() {
        // 应用语言设置
        this.i18nManager.setLanguage(this.state.settings.appLanguage);
        console.log('设置已应用:', this.state.settings);
    }

    // 全局方法，供HTML onclick调用
    toggleWordHighlight(word) {
        this.readerManager.toggleWordHighlight(word);
    }    changeCardColor(docId, color) {
        const doc = this.state.documents.find(d => d.id === docId);
        if (doc) {
            doc.cardColor = color;
            
            // 如果是自定义颜色（以#开头），动态生成相应的CSS变量
            if (color.startsWith('#')) {
                this.setCustomColorVariables(docId, color);
            } else {
                // 如果选择预设颜色，清除之前的自定义CSS
                const styleElement = document.getElementById(`custom-color-${docId}`);
                if (styleElement) {
                    styleElement.remove();
                }
            }
            
            this.state.saveDocuments();
                       this.uiManager.renderLibrary();
        }
        this.hideAllMenus();
    }// 为自定义颜色生成相应的CSS变量
    setCustomColorVariables(docId, color) {
        // 将十六进制颜色转换为RGB
        const rgb = this.hexToRgb(color);
        if (!rgb) return;
        
        // 生成更淡的颜色用于信息栏
        const lighterColor = this.lightenColor(rgb, 0.4); // 增加40%的亮度
        const metaColor = this.lightenColor(rgb, 0.2); // 增加20%的亮度
        
        // 创建自定义CSS样式
        const styleId = `custom-color-${docId}`;
        let styleElement = document.getElementById(styleId);
        
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }
        
        // 对比度颜色计算
        const contrastColor = this.getContrastColor(color);
        const lighterContrastColor = this.getContrastColor(this.rgbToHex(lighterColor));
        
        const customCSS = `
            .document-card[data-doc-id="${docId}"] {
                --card-bg: ${color} !important;
                --card-text: ${contrastColor} !important;
                --card-meta: ${this.rgbToHex(metaColor)} !important;
                --card-footer-bg: ${this.rgbToHex(lighterColor)} !important;
            }
            .document-list-item[data-doc-id="${docId}"] {
                --card-bg: ${color} !important;
                --card-text: ${contrastColor} !important;
                --card-meta: ${this.rgbToHex(metaColor)} !important;
                --card-footer-bg: ${this.rgbToHex(lighterColor)} !important;
            }
            /* 确保所有主题下都能正确显示 */
            [data-theme="dark"] .document-card[data-doc-id="${docId}"],
            [data-theme="sepia"] .document-card[data-doc-id="${docId}"],
            [data-theme="light"] .document-card[data-doc-id="${docId}"] {
                --card-bg: ${color} !important;
                --card-text: ${contrastColor} !important;
                --card-meta: ${this.rgbToHex(metaColor)} !important;
                --card-footer-bg: ${this.rgbToHex(lighterColor)} !important;
            }
            [data-theme="dark"] .document-list-item[data-doc-id="${docId}"],
            [data-theme="sepia"] .document-list-item[data-doc-id="${docId}"],
            [data-theme="light"] .document-list-item[data-doc-id="${docId}"] {
                --card-bg: ${color} !important;
                --card-text: ${contrastColor} !important;
                --card-meta: ${this.rgbToHex(metaColor)} !important;
                --card-footer-bg: ${this.rgbToHex(lighterColor)} !important;
            }
        `;
        
        styleElement.textContent = customCSS;
    }

    // 颜色处理工具函数
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    rgbToHex(rgb) {
        return "#" + ((1 << 24) + (Math.round(rgb.r) << 16) + (Math.round(rgb.g) << 8) + Math.round(rgb.b)).toString(16).slice(1);
    }

    lightenColor(rgb, amount) {
        return {
            r: Math.min(255, rgb.r + (255 - rgb.r) * amount),
            g: Math.min(255, rgb.g + (255 - rgb.g) * amount),
            b: Math.min(255, rgb.b + (255 - rgb.b) * amount)
        };
    }

    getContrastColor(hexcolor) {
        const rgb = this.hexToRgb(hexcolor);
        if (!rgb) return '#000000';
        
        // 计算亮度
        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        return brightness > 128 ? '#000000' : '#ffffff';
    }    
    // 隐藏所有菜单 - 由context-menu.js处理
    
    editDocumentInfo(docId) {
        const doc = this.state.documents.find(d => d.id === docId);
        if (doc) {
            // 简化版编辑 - 可以扩展为完整的编辑弹窗
            const newTitle = prompt('修改标题:', doc.title);
            const newLanguage = prompt('修改语言:', doc.language);
            const newTags = prompt('修改标签 (用逗号分隔):', doc.tags.join(', '));
            
            if (newTitle !== null) doc.title = newTitle.trim();
            if (newLanguage !== null) doc.language = newLanguage.trim();
            if (newTags !== null) doc.tags = newTags.split(',').map(tag => tag.trim()).filter(tag => tag);
            
            this.state.saveDocuments();
            this.uiManager.renderLibrary();
        }
        this.hideAllMenus();
    }

    selectDocument(docId) {
        // TODO: 实现选择模式
        console.log('选择文档:', docId);
        this.hideAllMenus();
    }

    addToFolder(docId) {
        // TODO: 实现添加到文件夹功能
        console.log('添加到文件夹:', docId);
        this.hideAllMenus();
    }

    deleteDocument(docId) {
        if (confirm('确定要删除这个文档吗？此操作不可撤销。')) {
            this.documentManager.deleteDocument(docId);
            this.uiManager.renderLibrary();
        }
        this.hideAllMenus();
    }

    openEditModal(docId) {
        const doc = this.state.documents.find(d => d.id === docId);
        if (doc) {
            // 打开导入模态框但填充现有数据用于编辑
            this.modalManager.openModal('import-modal');
            
            // 填充现有文档数据
            document.getElementById('doc-title').value = doc.title;
            document.getElementById('doc-lang').value = doc.language;
            document.getElementById('doc-tags').value = doc.tags.join(', ');
            document.getElementById('doc-content').value = doc.content;
            
            // 修改标题和按钮文字
            const modalTitle = document.querySelector('#import-modal h2');
            const submitBtn = document.querySelector('#import-form button[type="submit"]');
            if (modalTitle) modalTitle.textContent = '编辑文档';
            if (submitBtn) submitBtn.textContent = '保存修改';
            
            // 设置编辑模式标识
            this.uiManager.editingDocId = docId;
        }
        this.hideAllMenus();
    }
}

// ==================== 文件夹上下文菜单事件处理 ====================

// 重命名确认事件
document.addEventListener('DOMContentLoaded', function() {
    const confirmRenameBtn = document.getElementById('confirm-rename-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    
    if (confirmRenameBtn) {
        confirmRenameBtn.addEventListener('click', function() {
            const modal = document.getElementById('rename-modal');
            const input = document.getElementById('rename-input');
            const targetFolderId = modal.dataset.targetFolderId;
            
            if (targetFolderId && input.value.trim()) {
                if (window.app && window.app.folderManager) {
                    const success = window.app.folderManager.renameFolderById(targetFolderId, input.value.trim());
                    if (success) {
                        modal.classList.remove('active');
                        input.value = '';
                        delete modal.dataset.targetFolderId;
                    }
                }
            }
        });
    }
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            const modal = document.getElementById('confirm-delete-modal');
            const targetFolderId = modal.dataset.targetFolderId;
            
            if (targetFolderId) {
                if (window.app && window.app.folderManager) {
                    const success = window.app.folderManager.deleteFolderById(targetFolderId);
                    if (success) {
                        modal.classList.remove('active');
                        delete modal.dataset.targetFolderId;
                    }
                }
            }
        });
    }
});

// ==================== 应用启动 ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('开始初始化WordWeb应用...');
    
    // 应用初始化函数
    function initializeApp() {
        try {
            console.log('正在创建WordWeb应用实例...');
            // 创建并启动应用
            window.app = new WordWebApp();
            
            console.log('正在初始化应用...');
            window.app.init();
            
            console.log('WordWeb应用初始化完成');
            console.log('应用实例:', window.app);
        } catch (error) {
            console.error('应用初始化失败:', error);
            console.error('错误堆栈:', error.stack);
        }
    }
    
    // 监听数据库准备就绪事件
    document.addEventListener('databaseReady', function(event) {
        console.log('收到 databaseReady 事件，开始初始化应用...');
        initializeApp();
    });
    
    // 监听数据库初始化错误事件
    document.addEventListener('databaseError', function(event) {
        console.warn('收到 databaseError 事件，使用本地存储模式:', event.detail.error);
        // 即使数据库初始化失败，也继续初始化应用（使用原有的localStorage）
        initializeApp();
    });
    
    // 备用初始化逻辑：如果2秒后还没收到数据库事件，直接初始化
    setTimeout(() => {
        if (!window.app) {
            if (window.databaseInitializer && window.databaseInitializer.isInitialized()) {
                console.log('数据库已初始化但未收到事件，直接启动应用...');
                initializeApp();
            } else {
                console.log('超时未收到数据库事件，使用本地存储模式启动应用...');
                initializeApp();
            }
        }
    }, 2000);
});
