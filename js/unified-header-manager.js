/**
 * 统一头部功能管理器
 * 处理所有页面共有的头部按钮功能
 */

class UnifiedHeaderManager {
    constructor() {
        this.currentPage = this.detectCurrentPage();
        this.initializeEventListeners();
    }

    /**
     * 检测当前页面类型
     */
    detectCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('vocabulary.html')) return 'vocabulary';
        if (path.includes('review.html')) return 'review';
        return 'library';
    }

    /**
     * 初始化事件监听器
     */
    initializeEventListeners() {
        // 搜索按钮
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.handleSearch());
        }

        // 筛选按钮（生词本页面）
        const filterBtn = document.getElementById('filter-btn');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => this.handleFilter());
        }

        // 统计按钮（复习页面）
        const statsBtn = document.getElementById('stats-btn');
        if (statsBtn) {
            statsBtn.addEventListener('click', () => this.handleStats());
        }

        // 复习设置按钮（复习页面）
        const settingsReviewBtn = document.getElementById('settings-review-btn');
        if (settingsReviewBtn) {
            settingsReviewBtn.addEventListener('click', () => this.handleReviewSettings());
        }

        // 为按钮添加键盘快捷键支持
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    /**
     * 处理搜索功能
     */
    handleSearch() {
        if (this.currentPage === 'library') {
            this.showLibrarySearch();
        } else if (this.currentPage === 'vocabulary') {
            this.showVocabularySearch();
        }
    }

    /**
     * 显示书库搜索
     */
    showLibrarySearch() {
        // 创建搜索模态框
        const searchModal = this.createSearchModal('搜索文档', [
            { id: 'title', label: '标题', type: 'text' },
            { id: 'content', label: '内容', type: 'text' },
            { id: 'language', label: '语言', type: 'select', options: ['全部', 'English', '中文', 'Japanese'] }
        ]);
        
        document.body.appendChild(searchModal);
        this.showModal(searchModal);
    }

    /**
     * 显示生词本搜索
     */
    showVocabularySearch() {
        const searchModal = this.createSearchModal('搜索生词', [
            { id: 'word', label: '单词', type: 'text' },
            { id: 'definition', label: '释义', type: 'text' },
            { id: 'difficulty', label: '难度', type: 'select', options: ['全部', '简单', '中等', '困难'] }
        ]);
        
        document.body.appendChild(searchModal);
        this.showModal(searchModal);
    }

    /**
     * 处理筛选功能
     */
    handleFilter() {
        const filterModal = this.createFilterModal();
        document.body.appendChild(filterModal);
        this.showModal(filterModal);
    }

    /**
     * 处理统计功能
     */
    handleStats() {
        const statsModal = this.createStatsModal();
        document.body.appendChild(statsModal);
        this.showModal(statsModal);
    }

    /**
     * 处理复习设置
     */
    handleReviewSettings() {
        const settingsModal = this.createReviewSettingsModal();
        document.body.appendChild(settingsModal);
        this.showModal(settingsModal);
    }

    /**
     * 创建搜索模态框
     */
    createSearchModal(title, fields) {
        const modal = document.createElement('div');
        modal.className = 'modal unified-modal';
        modal.id = 'unified-search-modal';
        
        let fieldsHTML = '';
        fields.forEach(field => {
            if (field.type === 'text') {
                fieldsHTML += `
                    <div class="form-group">
                        <label for="search-${field.id}">${field.label}</label>
                        <input type="text" id="search-${field.id}" class="form-input" placeholder="输入${field.label}...">
                    </div>
                `;
            } else if (field.type === 'select') {
                let optionsHTML = '';
                field.options.forEach(option => {
                    optionsHTML += `<option value="${option}">${option}</option>`;
                });
                fieldsHTML += `
                    <div class="form-group">
                        <label for="search-${field.id}">${field.label}</label>
                        <select id="search-${field.id}" class="form-select">
                            ${optionsHTML}
                        </select>
                    </div>
                `;
            }
        });
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <form class="search-form">
                        ${fieldsHTML}
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
                    <button type="button" class="btn btn-primary" onclick="unifiedHeader.performSearch()">搜索</button>
                </div>
            </div>
        `;
        
        return modal;
    }

    /**
     * 创建筛选模态框
     */
    createFilterModal() {
        const modal = document.createElement('div');
        modal.className = 'modal unified-modal';
        modal.id = 'unified-filter-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>筛选生词</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="filter-options">
                        <div class="form-group">
                            <label>学习状态</label>
                            <div class="checkbox-group">
                                <label><input type="checkbox" value="new" checked> 新词</label>
                                <label><input type="checkbox" value="learning" checked> 学习中</label>
                                <label><input type="checkbox" value="mastered" checked> 已掌握</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>难度等级</label>
                            <div class="checkbox-group">
                                <label><input type="checkbox" value="easy" checked> 简单</label>
                                <label><input type="checkbox" value="medium" checked> 中等</label>
                                <label><input type="checkbox" value="hard" checked> 困难</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>词性</label>
                            <div class="checkbox-group">
                                <label><input type="checkbox" value="noun" checked> 名词</label>
                                <label><input type="checkbox" value="verb" checked> 动词</label>
                                <label><input type="checkbox" value="adjective" checked> 形容词</label>
                                <label><input type="checkbox" value="adverb" checked> 副词</label>
                                <label><input type="checkbox" value="other" checked> 其他</label>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
                    <button type="button" class="btn btn-outline" onclick="unifiedHeader.resetFilters()">重置</button>
                    <button type="button" class="btn btn-primary" onclick="unifiedHeader.applyFilters()">应用筛选</button>
                </div>
            </div>
        `;
        
        return modal;
    }

    /**
     * 创建统计模态框
     */
    createStatsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal unified-modal';
        modal.id = 'unified-stats-modal';
        
        // 这里应该从实际数据计算统计信息
        const stats = this.calculateStats();
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>学习统计</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-number">${stats.totalWords}</div>
                            <div class="stat-label">总词汇量</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${stats.masteredWords}</div>
                            <div class="stat-label">已掌握</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${stats.learningWords}</div>
                            <div class="stat-label">学习中</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${stats.todayReviews}</div>
                            <div class="stat-label">今日复习</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${stats.streak}天</div>
                            <div class="stat-label">连续学习</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${stats.accuracy}%</div>
                            <div class="stat-label">准确率</div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="this.closest('.modal').remove()">关闭</button>
                </div>
            </div>
        `;
        
        return modal;
    }

    /**
     * 创建复习设置模态框
     */
    createReviewSettingsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal unified-modal';
        modal.id = 'unified-review-settings-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>复习设置</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="settings-group">
                        <div class="form-group">
                            <label for="review-mode">复习模式</label>
                            <select id="review-mode" class="form-select">
                                <option value="flashcard">闪卡模式</option>
                                <option value="quiz">测验模式</option>
                                <option value="spelling">拼写模式</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="review-count">每次复习数量</label>
                            <input type="number" id="review-count" class="form-input" value="20" min="5" max="100">
                        </div>
                        <div class="form-group">
                            <label for="review-order">复习顺序</label>
                            <select id="review-order" class="form-select">
                                <option value="random">随机</option>
                                <option value="difficulty">按难度</option>
                                <option value="frequency">按频率</option>
                                <option value="recent">最近添加</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="auto-pronounce"> 自动发音
                            </label>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="show-progress"> 显示进度
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
                    <button type="button" class="btn btn-primary" onclick="unifiedHeader.saveReviewSettings()">保存设置</button>
                </div>
            </div>
        `;
        
        return modal;
    }

    /**
     * 显示模态框
     */
    showModal(modal) {
        modal.classList.add('active');
        
        // 绑定关闭事件
        const closeBtn = modal.querySelector('.modal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => modal.remove());
        }
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // ESC键关闭
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    /**
     * 执行搜索
     */
    performSearch() {
        // 这里应该根据当前页面执行相应的搜索逻辑
        console.log('执行搜索...');
        document.getElementById('unified-search-modal').remove();
    }

    /**
     * 重置筛选
     */
    resetFilters() {
        const checkboxes = document.querySelectorAll('#unified-filter-modal input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = true);
    }

    /**
     * 应用筛选
     */
    applyFilters() {
        // 这里应该根据选中的筛选条件过滤生词
        console.log('应用筛选...');
        document.getElementById('unified-filter-modal').remove();
    }

    /**
     * 保存复习设置
     */
    saveReviewSettings() {
        const settings = {
            mode: document.getElementById('review-mode').value,
            count: document.getElementById('review-count').value,
            order: document.getElementById('review-order').value,
            autoPronounce: document.getElementById('auto-pronounce').checked,
            showProgress: document.getElementById('show-progress').checked
        };
        
        localStorage.setItem('review-settings', JSON.stringify(settings));
        console.log('复习设置已保存:', settings);
        document.getElementById('unified-review-settings-modal').remove();
    }

    /**
     * 计算统计数据
     */
    calculateStats() {
        // 这里应该从实际的词汇数据计算
        return {
            totalWords: 156,
            masteredWords: 45,
            learningWords: 89,
            todayReviews: 23,
            streak: 7,
            accuracy: 85
        };
    }

    /**
     * 处理键盘快捷键
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + F: 搜索
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            this.handleSearch();
        }
        
        // Ctrl/Cmd + Shift + F: 筛选
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
            e.preventDefault();
            if (this.currentPage === 'vocabulary') {
                this.handleFilter();
            }
        }
    }
}

// 全局实例
window.unifiedHeader = new UnifiedHeaderManager();
