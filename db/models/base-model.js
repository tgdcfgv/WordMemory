/**
 * 基础数据模型类
 * 提供通用的数据操作方法
 */

class BaseModel {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        this.version = data.version || 1;
    }

    /**
     * 生成唯一ID
     */
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 更新时间戳
     */
    touch() {
        this.updatedAt = new Date().toISOString();
        this.version += 1;
    }

    /**
     * 转换为JSON对象
     */
    toJSON() {
        const obj = {};
        for (const key in this) {
            if (this.hasOwnProperty(key) && typeof this[key] !== 'function') {
                obj[key] = this[key];
            }
        }
        return obj;
    }

    /**
     * 从JSON对象创建实例
     */
    static fromJSON(json) {
        return new this(json);
    }

    /**
     * 验证数据完整性
     */
    validate() {
        if (!this.id) {
            throw new Error('ID不能为空');
        }
        if (!this.createdAt) {
            throw new Error('创建时间不能为空');
        }
        return true;
    }

    /**
     * 克隆实例
     */
    clone() {
        return this.constructor.fromJSON(this.toJSON());
    }
}

// 导出到全局
window.BaseModel = BaseModel;
