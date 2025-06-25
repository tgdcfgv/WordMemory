/**
 * 本地存储管理器
 * 提供统一的数据持久化接口
 */

class LocalStorageManager {
    constructor() {
        this.prefix = 'wordweb_';
        this.compressionThreshold = 10000; // 超过10KB的数据进行压缩
        this.encryptionKey = this.getOrCreateEncryptionKey();
    }

    /**
     * 获取或创建加密密钥
     */
    getOrCreateEncryptionKey() {
        const keyName = this.prefix + 'encryption_key';
        let key = localStorage.getItem(keyName);
        
        if (!key) {
            // 生成简单的加密密钥
            key = btoa(Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15));
            localStorage.setItem(keyName, key);
        }
        
        return key;
    }

    /**
     * 生成存储键名
     */
    getStorageKey(type, id = '') {
        return `${this.prefix}${type}${id ? '_' + id : ''}`;
    }

    /**
     * 保存数据
     */
    save(type, data, id = '') {
        try {
            const key = this.getStorageKey(type, id);
            let serializedData = JSON.stringify(data);
            
            // 添加元数据
            const metadata = {
                type: type,
                id: id,
                savedAt: new Date().toISOString(),
                version: '1.0',
                compressed: false,
                encrypted: false
            };

            // 检查是否需要压缩
            if (serializedData.length > this.compressionThreshold) {
                serializedData = this.compress(serializedData);
                metadata.compressed = true;
            }

            // 组合数据和元数据
            const finalData = {
                metadata: metadata,
                data: serializedData
            };

            localStorage.setItem(key, JSON.stringify(finalData));
            return true;
        } catch (error) {
            console.error(`保存数据失败 (${type}):`, error);
            
            // 如果存储空间不足，尝试清理
            if (error.name === 'QuotaExceededError') {
                this.cleanupOldData();
                // 重试一次
                try {
                    localStorage.setItem(key, JSON.stringify(finalData));
                    return true;
                } catch (retryError) {
                    console.error('重试保存失败:', retryError);
                    return false;
                }
            }
            
            return false;
        }
    }

    /**
     * 读取数据
     */
    load(type, id = '') {
        try {
            const key = this.getStorageKey(type, id);
            const rawData = localStorage.getItem(key);
            
            if (!rawData) {
                return null;
            }

            const storedData = JSON.parse(rawData);
            
            // 检查数据格式
            if (!storedData.metadata || !storedData.data) {
                // 兼容旧格式数据
                return rawData;
            }

            let data = storedData.data;

            // 解压缩数据
            if (storedData.metadata.compressed) {
                data = this.decompress(data);
            }

            // 解密数据（如果需要）
            if (storedData.metadata.encrypted) {
                data = this.decrypt(data);
            }

            return typeof data === 'string' ? JSON.parse(data) : data;
        } catch (error) {
            console.error(`读取数据失败 (${type}):`, error);
            return null;
        }
    }

    /**
     * 删除数据
     */
    remove(type, id = '') {
        try {
            const key = this.getStorageKey(type, id);
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`删除数据失败 (${type}):`, error);
            return false;
        }
    }

    /**
     * 检查数据是否存在
     */
    exists(type, id = '') {
        const key = this.getStorageKey(type, id);
        return localStorage.getItem(key) !== null;
    }

    /**
     * 获取所有指定类型的数据键
     */
    getKeys(type) {
        const prefix = this.getStorageKey(type);
        const keys = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                keys.push(key);
            }
        }
        
        return keys;
    }

    /**
     * 获取所有指定类型的数据
     */
    loadAll(type) {
        const keys = this.getKeys(type);
        const results = {};
        
        keys.forEach(key => {
            const id = key.replace(this.getStorageKey(type) + '_', '');
            const data = this.load(type, id);
            if (data) {
                results[id] = data;
            }
        });
        
        return results;
    }

    /**
     * 批量保存数据
     */
    saveBatch(type, dataMap) {
        const results = {};
        
        for (const [id, data] of Object.entries(dataMap)) {
            results[id] = this.save(type, data, id);
        }
        
        return results;
    }

    /**
     * 获取存储使用情况
     */
    getStorageInfo() {
        let totalSize = 0;
        let itemCount = 0;
        const typeStats = {};
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            
            if (key && key.startsWith(this.prefix)) {
                const size = key.length + (value ? value.length : 0);
                totalSize += size;
                itemCount++;
                
                // 统计各类型数据
                const type = key.replace(this.prefix, '').split('_')[0];
                if (!typeStats[type]) {
                    typeStats[type] = { count: 0, size: 0 };
                }
                typeStats[type].count++;
                typeStats[type].size += size;
            }
        }
        
        return {
            totalSize: totalSize,
            totalSizeFormatted: this.formatBytes(totalSize),
            itemCount: itemCount,
            typeStats: typeStats,
            availableSpace: this.getAvailableSpace()
        };
    }

    /**
     * 格式化字节数
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 获取可用存储空间（估算）
     */
    getAvailableSpace() {
        try {
            // 尝试存储一个测试字符串来估算可用空间
            const testKey = this.prefix + 'space_test';
            const testData = 'x'.repeat(1024); // 1KB 测试数据
            let availableKB = 0;
            
            while (availableKB < 10240) { // 最多测试10MB
                try {
                    localStorage.setItem(testKey, testData.repeat(availableKB + 1));
                    availableKB++;
                } catch (e) {
                    break;
                }
            }
            
            localStorage.removeItem(testKey);
            return availableKB * 1024; // 返回字节数
        } catch (error) {
            console.warn('无法检测可用存储空间:', error);
            return -1; // 未知
        }
    }

    /**
     * 清理旧数据
     */
    cleanupOldData() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30); // 30天前的数据
        
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.metadata && data.metadata.savedAt) {
                        const savedDate = new Date(data.metadata.savedAt);
                        if (savedDate < cutoffDate) {
                            keysToRemove.push(key);
                        }
                    }
                } catch (error) {
                    // 如果解析失败，可能是损坏的数据，也删除
                    keysToRemove.push(key);
                }
            }
        }
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        console.log(`清理了 ${keysToRemove.length} 个过期数据项`);
        return keysToRemove.length;
    }

    /**
     * 简单数据压缩（使用 LZ 算法的简化版本）
     */
    compress(data) {
        // 这里实现一个简单的压缩算法
        // 在实际项目中，可以使用 pako 或其他压缩库
        try {
            return btoa(data);
        } catch (error) {
            console.warn('压缩失败，返回原始数据:', error);
            return data;
        }
    }

    /**
     * 解压缩数据
     */
    decompress(compressedData) {
        try {
            return atob(compressedData);
        } catch (error) {
            console.warn('解压缩失败，返回原始数据:', error);
            return compressedData;
        }
    }

    /**
     * 简单加密（仅用于演示，实际项目应使用更安全的方法）
     */
    encrypt(data) {
        // 这里实现一个简单的加密算法
        // 在实际项目中，应使用 Web Crypto API 或其他安全库
        return btoa(data);
    }

    /**
     * 解密数据
     */
    decrypt(encryptedData) {
        try {
            return atob(encryptedData);
        } catch (error) {
            console.warn('解密失败，返回原始数据:', error);
            return encryptedData;
        }
    }

    /**
     * 导出所有数据
     */
    exportData() {
        const exportData = {
            exportedAt: new Date().toISOString(),
            version: '1.0',
            data: {}
        };
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                exportData.data[key] = localStorage.getItem(key);
            }
        }
        
        return exportData;
    }

    /**
     * 导入数据
     */
    importData(importData) {
        if (!importData || !importData.data) {
            throw new Error('无效的导入数据格式');
        }
        
        let importedCount = 0;
        
        for (const [key, value] of Object.entries(importData.data)) {
            if (key.startsWith(this.prefix)) {
                try {
                    localStorage.setItem(key, value);
                    importedCount++;
                } catch (error) {
                    console.error(`导入数据项失败 ${key}:`, error);
                }
            }
        }
        
        return importedCount;
    }

    /**
     * 清空所有应用数据
     */
    clearAll() {
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        return keysToRemove.length;
    }
}

// 导出到全局
window.LocalStorageManager = LocalStorageManager;
