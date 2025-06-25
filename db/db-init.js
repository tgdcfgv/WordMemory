/**
 * 数据库初始化脚本
 * 初始化数据库系统并提供统一入口
 */

// 数据库初始化器
class DatabaseInitializer {
    constructor() {
        this.databaseManager = null;
        this.initialized = false;
    }

    /**
     * 初始化数据库系统
     */
    async initialize() {
        if (this.initialized) {
            return this.databaseManager;
        }

        try {
            console.log('正在初始化数据库系统...');

            // 验证所有必需的组件是否已加载
            const requiredComponents = [
                'BaseModel', 'UserModel', 'DocumentModel', 'VocabularyModel',
                'LocalStorageManager', 'MigrationManager', 'DatabaseManager'
            ];

            for (const componentName of requiredComponents) {
                if (!window[componentName]) {
                    throw new Error(`组件 ${componentName} 未正确加载`);
                }
            }

            // 创建数据库管理器实例
            this.databaseManager = new window.DatabaseManager();

            // 等待数据库初始化完成
            await this.waitForInitialization();

            this.initialized = true;
            console.log('数据库系统初始化完成');

            // 在全局注册数据库管理器
            window.dbManager = this.databaseManager;

            return this.databaseManager;
        } catch (error) {
            console.error('数据库系统初始化失败:', error);
            throw error;
        }
    }

    /**
     * 等待数据库初始化完成
     */
    waitForInitialization() {
        return new Promise((resolve) => {
            // 简单的延迟等待，实际项目中可以使用事件监听
            setTimeout(() => {
                resolve();
            }, 100);
        });
    }

    /**
     * 获取数据库管理器
     */
    getDatabaseManager() {
        if (!this.initialized) {
            throw new Error('数据库系统尚未初始化，请先调用 initialize()');
        }
        return this.databaseManager;
    }

    /**
     * 检查初始化状态
     */
    isInitialized() {
        return this.initialized;
    }
}

// 创建全局数据库初始化器实例
window.databaseInitializer = new DatabaseInitializer();

// 自动初始化（可选）
document.addEventListener('DOMContentLoaded', async () => {
    // 给脚本一些时间来加载和执行
    setTimeout(async () => {
        try {
            console.log('DOM加载完成，开始数据库初始化...');
            
            // 检查必需组件是否已加载
            const requiredComponents = [
                'BaseModel', 'UserModel', 'DocumentModel', 'VocabularyModel',
                'LocalStorageManager', 'MigrationManager', 'DatabaseManager'
            ];
            
            console.log('检查组件加载状态:');
            for (const componentName of requiredComponents) {
                console.log(`${componentName}:`, window[componentName] ? '✓' : '✗');
            }
            
            await window.databaseInitializer.initialize();
            console.log('数据库系统自动初始化完成');
            
            // 触发自定义事件通知其他组件
            const event = new CustomEvent('databaseReady', {
                detail: { databaseManager: window.dbManager }
            });
            document.dispatchEvent(event);
            console.log('已触发 databaseReady 事件');
        } catch (error) {
            console.error('数据库系统自动初始化失败:', error);
            
            // 触发错误事件
            const errorEvent = new CustomEvent('databaseError', {
                detail: { error: error }
            });
            document.dispatchEvent(errorEvent);
            console.log('已触发 databaseError 事件');
        }
    }, 100); // 给脚本100ms时间来执行和导出到window
});

// 提供便捷的初始化函数
window.initializeDatabase = async () => {
    return await window.databaseInitializer.initialize();
};

// 提供便捷的获取数据库管理器函数
window.getDatabaseManager = () => {
    return window.databaseInitializer.getDatabaseManager();
};

console.log('数据库初始化脚本已加载');
