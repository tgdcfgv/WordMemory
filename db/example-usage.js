/**
 * 数据库使用示例
 * 演示如何在应用中使用数据库系统
 */

// 示例：初始化并使用数据库
async function databaseExample() {
    try {
        // 等待数据库初始化完成
        await window.initializeDatabase();
        const dbManager = window.getDatabaseManager();
        
        console.log('=== 数据库使用示例 ===');
        
        // 1. 用户操作示例
        console.log('\n1. 用户操作示例:');
        const currentUser = dbManager.currentUser;
        console.log('当前用户:', currentUser.displayName);
        
        // 更新用户偏好
        currentUser.updatePreferences({
            theme: 'dark',
            fontSize: 18,
            autoSave: true
        });
        await dbManager.saveUser(currentUser);
        console.log('用户偏好已更新');
        
        // 2. 文档操作示例
        console.log('\n2. 文档操作示例:');
        
        // 创建新文档
        const newDocument = new DocumentModel({
            title: '示例英语文章',
            content: 'This is a sample English article for learning vocabulary. Hello world!',
            language: 'English',
            tags: ['学习', '英语', '示例']
        });
        
        await dbManager.saveDocument(newDocument);
        console.log('新文档已创建:', newDocument.title);
        
        // 添加词汇到文档
        newDocument.addVocabulary('hello', '你好', 'Hello world!');
        newDocument.addVocabulary('world', '世界', 'Hello world!');
        await dbManager.saveDocument(newDocument);
        console.log('词汇已添加到文档');
        
        // 更新阅读进度
        newDocument.updateReadingProgress(50);
        await dbManager.saveDocument(newDocument);
        console.log('阅读进度已更新到 50%');
        
        // 3. 词汇操作示例
        console.log('\n3. 词汇操作示例:');
        
        // 创建独立的词汇项
        const vocabulary1 = new VocabularyModel({
            word: 'example',
            pronunciation: '/ɪɡˈzæmpəl/',
            definition: 'a thing characteristic of its kind or illustrating a general rule',
            translation: '例子，示例',
            language: 'English',
            difficulty: 2
        });
        
        await dbManager.saveVocabulary(vocabulary1);
        console.log('词汇已创建:', vocabulary1.word);
        
        // 记录复习
        vocabulary1.recordReview(true, 8); // 正确，花费8秒
        await dbManager.saveVocabulary(vocabulary1);
        console.log('复习记录已保存');
        
        const vocabulary2 = new VocabularyModel({
            word: 'database',
            pronunciation: '/ˈdeɪtəbeɪs/',
            definition: 'a structured set of data held in a computer',
            translation: '数据库',
            language: 'English',
            difficulty: 3
        });
        
        await dbManager.saveVocabulary(vocabulary2);
        
        // 4. 搜索操作示例
        console.log('\n4. 搜索操作示例:');
        
        // 搜索文档
        const documentResults = await dbManager.searchDocuments('英语', {
            language: 'English',
            sortBy: 'updatedAt',
            limit: 10
        });
        console.log('找到文档:', documentResults.length, '个');
        
        // 搜索词汇
        const vocabularyResults = await dbManager.searchVocabulary('example', {
            difficulty: 2,
            limit: 10
        });
        console.log('找到词汇:', vocabularyResults.length, '个');
        
        // 获取需要复习的词汇
        const reviewList = await dbManager.getVocabularyForReview(5);
        console.log('需要复习的词汇:', reviewList.length, '个');
        
        // 5. 统计信息示例
        console.log('\n5. 统计信息示例:');
        const stats = await dbManager.getStatistics();
        console.log('文档总数:', stats.documents.total);
        console.log('词汇总数:', stats.vocabulary.total);
        console.log('需要复习的词汇:', stats.vocabulary.needsReview);
        console.log('存储使用情况:', stats.storage.totalSizeFormatted);
        
        // 6. 备份和恢复示例
        console.log('\n6. 备份操作示例:');
        const backupData = await dbManager.backup();
        console.log('备份创建成功，数据大小:', JSON.stringify(backupData).length, '字符');
        
        console.log('\n=== 示例完成 ===');
        
    } catch (error) {
        console.error('数据库示例运行失败:', error);
    }
}

// 页面加载完成后运行示例
document.addEventListener('DOMContentLoaded', () => {
    // 监听数据库就绪事件
    document.addEventListener('databaseReady', () => {
        console.log('数据库已准备就绪，可以运行示例');
        
        // 在控制台提供运行示例的函数
        window.runDatabaseExample = databaseExample;
        
        console.log('在控制台运行 runDatabaseExample() 来查看数据库使用示例');
    });
});

// 演示文件夹管理器与数据库的集成
function demonstrateFolderIntegration() {
    if (!window.dbManager) {
        console.error('数据库未初始化');
        return;
    }
    
    console.log('\n=== 文件夹管理器集成示例 ===');
    
    // 获取文件夹管理器
    const folderManager = window.app?.folderManager;
    if (!folderManager) {
        console.error('文件夹管理器未找到');
        return;
    }
    
    console.log('文件夹管理器已连接到数据库:', !!folderManager.databaseManager);
    console.log('当前路径:', folderManager.currentPath || '根目录');
    console.log('当前路径下的文件夹:', folderManager.getFoldersInCurrentPath().length, '个');
    console.log('当前路径下的文档:', folderManager.getDocumentsInCurrentPath().length, '个');
}

// 导出函数供控制台使用
window.demonstrateFolderIntegration = demonstrateFolderIntegration;

console.log('数据库使用示例已加载，使用以下函数进行测试:');
console.log('- runDatabaseExample(): 运行完整的数据库功能示例');
console.log('- demonstrateFolderIntegration(): 演示文件夹管理器集成');
