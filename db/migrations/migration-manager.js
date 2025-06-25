/**
 * 迁移管理器
 * 管理数据库版本迁移
 */

class MigrationManager {
    constructor(storageManager) {
        this.storageManager = storageManager;
        this.migrations = new Map();
        this.currentVersion = '1.0.0';
        
        this.registerMigrations();
    }

    /**
     * 注册所有迁移
     */
    registerMigrations() {
        // 这里注册所有的迁移文件
        // this.registerMigration('1.0.1', Migration_1_0_1);
        // 更多迁移...
    }

    /**
     * 注册单个迁移
     */
    registerMigration(version, migrationClass) {
        this.migrations.set(version, migrationClass);
    }

    /**
     * 获取当前数据库版本
     */
    getCurrentVersion() {
        return this.storageManager.load('system', 'db_version') || '1.0.0';
    }

    /**
     * 设置数据库版本
     */
    setVersion(version) {
        this.storageManager.save('system', version, 'db_version');
        this.currentVersion = version;
    }

    /**
     * 检查是否需要迁移
     */
    needsMigration(targetVersion) {
        const currentVersion = this.getCurrentVersion();
        return this.compareVersions(currentVersion, targetVersion) < 0;
    }

    /**
     * 执行迁移到目标版本
     */
    async migrateTo(targetVersion) {
        const currentVersion = this.getCurrentVersion();
        
        if (!this.needsMigration(targetVersion)) {
            console.log('数据库已是最新版本，无需迁移');
            return true;
        }

        console.log(`开始迁移数据库从 ${currentVersion} 到 ${targetVersion}`);

        try {
            // 创建备份
            const backup = await this.createBackup();
            
            // 获取需要执行的迁移列表
            const migrationsToRun = this.getMigrationsToRun(currentVersion, targetVersion);
            
            // 执行迁移
            for (const migrationVersion of migrationsToRun) {
                await this.runMigration(migrationVersion, 'up');
            }
            
            // 更新版本号
            this.setVersion(targetVersion);
            
            console.log(`数据库迁移完成: ${currentVersion} -> ${targetVersion}`);
            return true;
            
        } catch (error) {
            console.error('迁移失败:', error);
            
            // 尝试恢复备份
            try {
                await this.restoreBackup(backup);
                console.log('已恢复到迁移前状态');
            } catch (restoreError) {
                console.error('恢复备份失败:', restoreError);
            }
            
            return false;
        }
    }

    /**
     * 回滚到指定版本
     */
    async rollbackTo(targetVersion) {
        const currentVersion = this.getCurrentVersion();
        
        if (this.compareVersions(currentVersion, targetVersion) <= 0) {
            console.log('目标版本不低于当前版本，无需回滚');
            return true;
        }

        console.log(`开始回滚数据库从 ${currentVersion} 到 ${targetVersion}`);

        try {
            // 创建备份
            const backup = await this.createBackup();
            
            // 获取需要回滚的迁移列表
            const migrationsToRollback = this.getMigrationsToRollback(currentVersion, targetVersion);
            
            // 执行回滚
            for (const migrationVersion of migrationsToRollback.reverse()) {
                await this.runMigration(migrationVersion, 'down');
            }
            
            // 更新版本号
            this.setVersion(targetVersion);
            
            console.log(`数据库回滚完成: ${currentVersion} -> ${targetVersion}`);
            return true;
            
        } catch (error) {
            console.error('回滚失败:', error);
            
            // 尝试恢复备份
            try {
                await this.restoreBackup(backup);
                console.log('已恢复到回滚前状态');
            } catch (restoreError) {
                console.error('恢复备份失败:', restoreError);
            }
            
            return false;
        }
    }

    /**
     * 执行单个迁移
     */
    async runMigration(version, direction = 'up') {
        const MigrationClass = this.migrations.get(version);
        
        if (!MigrationClass) {
            throw new Error(`找不到版本 ${version} 的迁移文件`);
        }

        console.log(`执行迁移 ${version} (${direction})`);

        const migration = new MigrationClass(this.storageManager);
        
        if (direction === 'up') {
            const success = await migration.up();
            if (!success) {
                throw new Error(`迁移 ${version} 执行失败`);
            }
            
            // 验证迁移结果
            if (migration.validate) {
                const valid = await migration.validate();
                if (!valid) {
                    throw new Error(`迁移 ${version} 验证失败`);
                }
            }
        } else {
            const success = await migration.down();
            if (!success) {
                throw new Error(`回滚 ${version} 执行失败`);
            }
        }

        console.log(`迁移 ${version} (${direction}) 完成`);
    }

    /**
     * 获取需要执行的迁移列表
     */
    getMigrationsToRun(fromVersion, toVersion) {
        const migrations = [];
        
        for (const [version, migrationClass] of this.migrations) {
            if (this.compareVersions(fromVersion, version) < 0 && 
                this.compareVersions(version, toVersion) <= 0) {
                migrations.push(version);
            }
        }
        
        // 按版本号排序
        migrations.sort(this.compareVersions);
        
        return migrations;
    }

    /**
     * 获取需要回滚的迁移列表
     */
    getMigrationsToRollback(fromVersion, toVersion) {
        const migrations = [];
        
        for (const [version, migrationClass] of this.migrations) {
            if (this.compareVersions(toVersion, version) < 0 && 
                this.compareVersions(version, fromVersion) <= 0) {
                migrations.push(version);
            }
        }
        
        // 按版本号排序
        migrations.sort(this.compareVersions);
        
        return migrations;
    }

    /**
     * 比较版本号
     */
    compareVersions(version1, version2) {
        const v1Parts = version1.split('.').map(Number);
        const v2Parts = version2.split('.').map(Number);
        
        for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
            const v1Part = v1Parts[i] || 0;
            const v2Part = v2Parts[i] || 0;
            
            if (v1Part < v2Part) return -1;
            if (v1Part > v2Part) return 1;
        }
        
        return 0;
    }

    /**
     * 创建数据备份
     */
    async createBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupKey = `backup_${timestamp}`;
        
        const backup = {
            version: this.getCurrentVersion(),
            timestamp: new Date().toISOString(),
            data: this.storageManager.exportData()
        };
        
        this.storageManager.save('backup', backup, backupKey);
        console.log(`创建备份: ${backupKey}`);
        
        return backupKey;
    }

    /**
     * 恢复数据备份
     */
    async restoreBackup(backupKey) {
        const backup = this.storageManager.load('backup', backupKey);
        
        if (!backup) {
            throw new Error(`找不到备份: ${backupKey}`);
        }

        console.log(`恢复备份: ${backupKey}`);
        
        // 清空当前数据
        this.storageManager.clearAll();
        
        // 恢复备份数据
        this.storageManager.importData(backup.data);
        
        // 恢复版本信息
        this.setVersion(backup.version);
        
        console.log('备份恢复完成');
    }

    /**
     * 获取所有备份
     */
    getAllBackups() {
        const backups = this.storageManager.loadAll('backup');
        const backupList = [];
        
        for (const [key, backup] of Object.entries(backups)) {
            backupList.push({
                key: key,
                version: backup.version,
                timestamp: backup.timestamp,
                size: JSON.stringify(backup).length
            });
        }
        
        // 按时间排序
        backupList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return backupList;
    }

    /**
     * 删除旧备份
     */
    cleanupOldBackups(keepCount = 5) {
        const backups = this.getAllBackups();
        const toDelete = backups.slice(keepCount);
        
        toDelete.forEach(backup => {
            this.storageManager.remove('backup', backup.key.replace('backup_', ''));
        });
        
        console.log(`清理了 ${toDelete.length} 个旧备份`);
        return toDelete.length;
    }

    /**
     * 获取迁移状态
     */
    getStatus() {
        const currentVersion = this.getCurrentVersion();
        const availableMigrations = Array.from(this.migrations.keys()).sort(this.compareVersions);
        const latestVersion = availableMigrations[availableMigrations.length - 1] || currentVersion;
        
        return {
            currentVersion: currentVersion,
            latestVersion: latestVersion,
            needsMigration: this.needsMigration(latestVersion),
            availableMigrations: availableMigrations,
            backupCount: this.getAllBackups().length
        };
    }
}

// 导出到全局
window.MigrationManager = MigrationManager;
