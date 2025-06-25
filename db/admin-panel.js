/**
 * 数据库管理界面
 * 提供数据库状态查看、备份恢复等功能
 */

class DatabaseAdminPanel {
    constructor() {
        this.databaseManager = null;
        this.isVisible = false;
        this.initializePanel();
    }

    /**
     * 初始化管理面板
     */
    initializePanel() {
        // 监听数据库就绪事件
        document.addEventListener('databaseReady', (event) => {
            this.databaseManager = event.detail.databaseManager;
            this.setupPanel();
        });

        // 创建面板HTML
        this.createPanelHTML();
        this.bindEvents();
    }

    /**
     * 创建面板HTML结构
     */
    createPanelHTML() {
        const panelHTML = `
            <div id="db-admin-panel" class="db-admin-panel" style="display: none;">
                <div class="admin-panel-header">
                    <h3>数据库管理</h3>
                    <button id="close-admin-panel" class="close-btn">&times;</button>
                </div>
                <div class="admin-panel-content">
                    <div class="admin-section">
                        <h4>系统状态</h4>
                        <div class="status-grid">
                            <div class="status-item">
                                <span class="status-label">数据库状态:</span>
                                <span id="db-status" class="status-value">未连接</span>
                            </div>
                            <div class="status-item">
                                <span class="status-label">当前版本:</span>
                                <span id="db-version" class="status-value">-</span>
                            </div>
                            <div class="status-item">
                                <span class="status-label">存储使用:</span>
                                <span id="storage-usage" class="status-value">-</span>
                            </div>
                        </div>
                    </div>

                    <div class="admin-section">
                        <h4>数据统计</h4>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="stat-number" id="total-documents">0</span>
                                <span class="stat-label">文档总数</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number" id="total-vocabulary">0</span>
                                <span class="stat-label">词汇总数</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number" id="needs-review">0</span>
                                <span class="stat-label">待复习</span>
                            </div>
                        </div>
                    </div>

                    <div class="admin-section">
                        <h4>数据管理</h4>
                        <div class="admin-actions">
                            <button id="create-backup-btn" class="admin-btn primary">创建备份</button>
                            <button id="import-backup-btn" class="admin-btn secondary">导入备份</button>
                            <button id="export-data-btn" class="admin-btn secondary">导出数据</button>
                            <button id="clear-cache-btn" class="admin-btn warning">清理缓存</button>
                            <button id="clear-all-data-btn" class="admin-btn danger">清空所有数据</button>
                        </div>
                    </div>

                    <div class="admin-section">
                        <h4>操作日志</h4>
                        <div id="admin-log" class="admin-log">
                            <div class="log-entry">数据库管理面板已启动</div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="db-admin-overlay" class="admin-overlay" style="display: none;"></div>
        `;

        // 创建样式
        const styleHTML = `
            <style>
                .db-admin-panel {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 600px;
                    max-height: 80vh;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    z-index: 10000;
                    overflow: hidden;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .admin-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    z-index: 9999;
                }

                .admin-panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    background: #f8f9fa;
                    border-bottom: 1px solid #e9ecef;
                }

                .admin-panel-header h3 {
                    margin: 0;
                    color: #333;
                    font-size: 18px;
                }

                .close-btn {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #666;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .close-btn:hover {
                    color: #333;
                    background: #e9ecef;
                    border-radius: 4px;
                }

                .admin-panel-content {
                    padding: 20px;
                    max-height: calc(80vh - 80px);
                    overflow-y: auto;
                }

                .admin-section {
                    margin-bottom: 24px;
                }

                .admin-section h4 {
                    margin: 0 0 12px 0;
                    color: #333;
                    font-size: 16px;
                    font-weight: 600;
                }

                .status-grid {
                    display: grid;
                    gap: 8px;
                }

                .status-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 12px;
                    background: #f8f9fa;
                    border-radius: 4px;
                }

                .status-label {
                    color: #666;
                }

                .status-value {
                    color: #333;
                    font-weight: 500;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                }

                .stat-item {
                    text-align: center;
                    padding: 16px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }

                .stat-number {
                    display: block;
                    font-size: 24px;
                    font-weight: bold;
                    color: #007bff;
                }

                .stat-label {
                    display: block;
                    font-size: 12px;
                    color: #666;
                    margin-top: 4px;
                }

                .admin-actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .admin-btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s;
                }

                .admin-btn.primary {
                    background: #007bff;
                    color: white;
                }

                .admin-btn.secondary {
                    background: #6c757d;
                    color: white;
                }

                .admin-btn.warning {
                    background: #ffc107;
                    color: #212529;
                }

                .admin-btn.danger {
                    background: #dc3545;
                    color: white;
                }

                .admin-btn:hover {
                    opacity: 0.9;
                    transform: translateY(-1px);
                }

                .admin-log {
                    background: #f8f9fa;
                    border: 1px solid #e9ecef;
                    border-radius: 4px;
                    padding: 12px;
                    max-height: 150px;
                    overflow-y: auto;
                    font-family: monospace;
                    font-size: 12px;
                }

                .log-entry {
                    margin-bottom: 4px;
                    color: #333;
                }

                .log-entry.success { color: #28a745; }
                .log-entry.warning { color: #ffc107; }
                .log-entry.error { color: #dc3545; }

                /* 暗色主题支持 */
                @media (prefers-color-scheme: dark) {
                    .db-admin-panel {
                        background: #2d3748;
                        color: #e2e8f0;
                    }
                    
                    .admin-panel-header {
                        background: #4a5568;
                        border-bottom-color: #4a5568;
                    }
                    
                    .status-item, .stat-item, .admin-log {
                        background: #4a5568;
                    }
                    
                    .status-label, .stat-label, .log-entry {
                        color: #cbd5e0;
                    }
                }
            </style>
        `;

        // 添加到页面
        document.head.insertAdjacentHTML('beforeend', styleHTML);
        document.body.insertAdjacentHTML('beforeend', panelHTML);
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 关闭面板
        document.getElementById('close-admin-panel').addEventListener('click', () => {
            this.hidePanel();
        });

        document.getElementById('db-admin-overlay').addEventListener('click', () => {
            this.hidePanel();
        });

        // 管理操作
        document.getElementById('create-backup-btn').addEventListener('click', () => {
            this.createBackup();
        });

        document.getElementById('import-backup-btn').addEventListener('click', () => {
            this.importBackup();
        });

        document.getElementById('export-data-btn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('clear-cache-btn').addEventListener('click', () => {
            this.clearCache();
        });

        document.getElementById('clear-all-data-btn').addEventListener('click', () => {
            this.clearAllData();
        });

        // 添加快捷键支持 (Ctrl+Shift+D)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.togglePanel();
            }
        });
    }

    /**
     * 设置面板数据
     */
    async setupPanel() {
        if (!this.databaseManager) return;

        try {
            // 更新状态信息
            document.getElementById('db-status').textContent = '已连接';
            document.getElementById('db-status').style.color = '#28a745';

            // 更新统计数据
            await this.updateStatistics();

            // 更新存储信息
            this.updateStorageInfo();

            this.addLogEntry('数据库连接成功', 'success');
        } catch (error) {
            this.addLogEntry('设置面板失败: ' + error.message, 'error');
        }
    }

    /**
     * 更新统计数据
     */
    async updateStatistics() {
        try {
            const stats = await this.databaseManager.getStatistics();
            
            document.getElementById('total-documents').textContent = stats.documents.total;
            document.getElementById('total-vocabulary').textContent = stats.vocabulary.total;
            document.getElementById('needs-review').textContent = stats.vocabulary.needsReview;
        } catch (error) {
            this.addLogEntry('更新统计数据失败: ' + error.message, 'error');
        }
    }

    /**
     * 更新存储信息
     */
    updateStorageInfo() {
        try {
            const storageInfo = this.databaseManager.storageManager.getStorageInfo();
            document.getElementById('storage-usage').textContent = storageInfo.totalSizeFormatted;
        } catch (error) {
            this.addLogEntry('更新存储信息失败: ' + error.message, 'error');
        }
    }

    /**
     * 显示面板
     */
    showPanel() {
        document.getElementById('db-admin-panel').style.display = 'block';
        document.getElementById('db-admin-overlay').style.display = 'block';
        this.isVisible = true;
        
        // 刷新数据
        if (this.databaseManager) {
            this.updateStatistics();
            this.updateStorageInfo();
        }
    }

    /**
     * 隐藏面板
     */
    hidePanel() {
        document.getElementById('db-admin-panel').style.display = 'none';
        document.getElementById('db-admin-overlay').style.display = 'none';
        this.isVisible = false;
    }

    /**
     * 切换面板显示状态
     */
    togglePanel() {
        if (this.isVisible) {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    }

    /**
     * 添加日志条目
     */
    addLogEntry(message, type = 'info') {
        const logContainer = document.getElementById('admin-log');
        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = `[${timestamp}] ${message}`;
        
        logContainer.appendChild(entry);
        logContainer.scrollTop = logContainer.scrollHeight;

        // 限制日志条目数量
        const entries = logContainer.querySelectorAll('.log-entry');
        if (entries.length > 50) {
            entries[0].remove();
        }
    }

    /**
     * 创建备份
     */
    async createBackup() {
        try {
            this.addLogEntry('正在创建备份...');
            const backupData = await this.databaseManager.backup();
            
            // 下载备份文件
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { 
                type: 'application/json' 
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `wordweb-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.addLogEntry('备份创建成功', 'success');
        } catch (error) {
            this.addLogEntry('创建备份失败: ' + error.message, 'error');
        }
    }

    /**
     * 导入备份
     */
    importBackup() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                this.addLogEntry('正在导入备份...');
                const text = await file.text();
                const backupData = JSON.parse(text);
                
                if (confirm('导入备份将覆盖现有数据，是否继续？')) {
                    await this.databaseManager.restore(backupData);
                    this.addLogEntry('备份导入成功', 'success');
                    await this.updateStatistics();
                    this.updateStorageInfo();
                }
            } catch (error) {
                this.addLogEntry('导入备份失败: ' + error.message, 'error');
            }
        });
        
        input.click();
    }

    /**
     * 导出数据
     */
    async exportData() {
        try {
            this.addLogEntry('正在导出数据...');
            const exportData = this.databaseManager.storageManager.exportData();
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                type: 'application/json' 
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `wordweb-export-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.addLogEntry('数据导出成功', 'success');
        } catch (error) {
            this.addLogEntry('导出数据失败: ' + error.message, 'error');
        }
    }

    /**
     * 清理缓存
     */
    clearCache() {
        try {
            this.databaseManager.clearCache();
            this.addLogEntry('缓存已清理', 'success');
        } catch (error) {
            this.addLogEntry('清理缓存失败: ' + error.message, 'error');
        }
    }

    /**
     * 清空所有数据
     */
    async clearAllData() {
        if (!confirm('这将删除所有数据，此操作不可恢复！是否继续？')) {
            return;
        }
        
        if (!confirm('请再次确认：真的要删除所有数据吗？')) {
            return;
        }
        
        try {
            this.addLogEntry('正在清空所有数据...', 'warning');
            const cleared = await this.databaseManager.clearAllData();
            this.addLogEntry(`已清空 ${cleared} 项数据`, 'success');
            
            await this.updateStatistics();
            this.updateStorageInfo();
        } catch (error) {
            this.addLogEntry('清空数据失败: ' + error.message, 'error');
        }
    }
}

// 创建全局实例
window.databaseAdminPanel = new DatabaseAdminPanel();

// 提供便捷的访问函数
window.showDatabaseAdmin = () => {
    window.databaseAdminPanel.showPanel();
};

console.log('数据库管理面板已加载');
console.log('使用 showDatabaseAdmin() 打开管理面板，或按 Ctrl+Shift+D');
