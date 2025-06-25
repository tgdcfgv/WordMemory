/**
 * 演示数据初始化
 * 用于测试文件夹管理系统
 */

// 在应用启动后添加一些演示数据
document.addEventListener('DOMContentLoaded', function() {
    // 延迟3秒后添加演示数据，确保应用完全加载
    setTimeout(() => {
        if (window.app && window.app.folderManager && window.app.documentManager) {
            // 检查是否已有数据
            if (window.app.state.documents.length === 0) {
                console.log('添加演示数据...');
                
                // 创建演示文档
                const doc1 = window.app.documentManager.createDocument(
                    'The Great Gatsby', 
                    'English', 
                    'classic, literature', 
                    'In my younger and more vulnerable years my father gave me some advice that I\'ve carried with me ever since. "Whenever you feel like criticizing anyone," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."'
                );
                
                const doc2 = window.app.documentManager.createDocument(
                    'To Kill a Mockingbird', 
                    'English', 
                    'classic, social', 
                    'When I was almost six and Jem was nearly ten, our summertime boundaries (within calling distance of Calpurnia) were Mrs. Henry Lafayette Dubose\'s house two doors to the north of us, and the Radley Place three doors to the south.'
                );
                  // 手动创建演示文件夹（模拟用户操作）
                const folder1 = {
                    name: 'Classic Literature',
                    path: 'Classic Literature',
                    parentPath: '',
                    createdAt: new Date().toISOString(),
                    documentCount: 0
                };
                
                const folder2 = {
                    name: 'Modern Fiction',
                    path: 'Modern Fiction',
                    parentPath: '',
                    createdAt: new Date().toISOString(),
                    documentCount: 0
                };
                
                window.app.folderManager.folders.set('Classic Literature', folder1);
                window.app.folderManager.folders.set('Modern Fiction', folder2);
                window.app.folderManager.documents.set('Classic Literature', []);
                window.app.folderManager.documents.set('Modern Fiction', []);
                
                // 将文档添加到文件夹
                window.app.folderManager.addDocumentToFolder(doc1.id, 'Classic Literature');
                window.app.folderManager.addDocumentToFolder(doc2.id, 'Classic Literature');
                
                // 刷新视图
                window.app.uiManager.renderLibrary();
                
                console.log('演示数据添加完成');
            }
        }
    }, 3000);
});

/**
 * 测试文件夹管理系统的完整性
 */
function testFolderSystem() {
    console.log('=== 开始测试文件夹管理系统 ===');
    
    if (!window.app || !window.app.folderManager) {
        console.error('文件夹管理器未初始化');
        return false;
    }
    
    const fm = window.app.folderManager;
    
    // 测试1: 创建文件夹
    console.log('测试1: 创建文件夹');
    const testFolderCreated = fm.createNewFolder('测试文件夹');
    console.log('创建结果:', testFolderCreated);
    
    // 测试2: 获取文件夹列表
    console.log('测试2: 获取文件夹列表');
    const folders = fm.getFoldersInCurrentPath();
    console.log('文件夹列表:', folders);
    
    // 测试3: 创建文档并添加到文件夹
    if (window.app.documentManager) {
        console.log('测试3: 创建文档并添加到文件夹');
        const testDoc = window.app.documentManager.createDocument(
            '测试文档',
            'Chinese',
            'test',
            '这是一个测试文档的内容。'
        );
        
        const addResult = fm.addDocumentToFolder(testDoc.id, '测试文件夹');
        console.log('添加文档结果:', addResult);
        
        // 测试4: 移动文档
        console.log('测试4: 移动文档到根目录');
        const moveResult = fm.moveDocumentToFolder(testDoc.id, '测试文件夹', '');
        console.log('移动文档结果:', moveResult);
        
        // 测试5: 删除文档
        console.log('测试5: 删除测试文档');
        window.app.documentManager.deleteDocument(testDoc.id);
    }
    
    // 测试6: 重命名文件夹
    console.log('测试6: 重命名文件夹');
    const renameResult = fm.renameFolder('测试文件夹', '重命名的测试文件夹');
    console.log('重命名结果:', renameResult);
    
    // 测试7: 删除文件夹
    console.log('测试7: 删除测试文件夹');
    const deleteResult = fm.deleteFolder('重命名的测试文件夹');
    console.log('删除结果:', deleteResult);
    
    console.log('=== 文件夹管理系统测试完成 ===');
    return true;
}

// 将测试函数绑定到全局，方便在控制台调用
window.testFolderSystem = testFolderSystem;
