/**
 * 文件夹管理系�?
 * 提供两层文件结构：文件夹 -> 文件
 */

class FolderManager {
    constructor() {
        this.currentPath = '';
        this.navigationHistory = [''];
        this.historyIndex = 0;
        this.folders = new Map(); // 存储文件夹数�?
        this.documents = new Map(); // 存储文档数据，按路径分组
        this.databaseManager = null; // 数据库管理器
        
        // 确保方法绑定正确
        this.addFolderToView = this.addFolderToView.bind(this);
        
        // 等待数据库准备就�?
        this.initializeWithDatabase();
        
        // 添加修复添加按钮菜单显示问题
        if (document.getElementById('add-menu-btn')) {
            setTimeout(() => this.fixAddMenuZIndexIssues(), 500);
        }
    }

    /**
     * 初始化默认文件结�?
     */
    initializeDefaultStructure() {
        // 从localStorage恢复数据
        const savedFolders = localStorage.getItem('wordweb_folders');
        const savedDocuments = localStorage.getItem('wordweb_documents');
        
        if (savedFolders) {
            this.folders = new Map(JSON.parse(savedFolders));
        }
        
        if (savedDocuments) {
            const docs = JSON.parse(savedDocuments);
            this.documents = new Map();
            for (const [path, docList] of Object.entries(docs)) {
                this.documents.set(path, docList);
            }
        } else {
            // 初始化根目录文档列表
            this.documents.set('', []);
        }
    }

    /**
     * 保存数据到localStorage
     */
    saveData() {
        localStorage.setItem('wordweb_folders', JSON.stringify([...this.folders]));
        
        const docsObject = {};
        for (const [path, docs] of this.documents) {
            docsObject[path] = docs;
        }
        localStorage.setItem('wordweb_documents', JSON.stringify(docsObject));
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 导航按钮事件
        document.getElementById('nav-back-btn').addEventListener('click', () => this.goBack());
        document.getElementById('nav-forward-btn').addEventListener('click', () => this.goForward());
        document.getElementById('nav-up-btn').addEventListener('click', () => this.goUp());
        
        // 新的添加内容按钮事件
        this.bindAddMenuEvents();

        // 新建文件夹弹窗事�?
        document.getElementById('close-new-folder-modal').addEventListener('click', () => this.hideNewFolderModal());
        document.getElementById('cancel-new-folder-btn').addEventListener('click', () => this.hideNewFolderModal());
        document.getElementById('confirm-new-folder-btn').addEventListener('click', () => this.createNewFolder());
        
        // 新建文件夹输入框回车确认
        document.getElementById('new-folder-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.createNewFolder();
            } else if (e.key === 'Escape') {
                this.hideNewFolderModal();
            }
        });

        // 面包屑导航点击事�?
        document.getElementById('breadcrumb').addEventListener('click', (e) => {
            const item = e.target.closest('.breadcrumb-item');
            if (item && item.dataset.path !== undefined) {
                this.navigateTo(item.dataset.path);
            }
        });
    }

    /**
     * 绑定添加内容菜单事件
     */
    bindAddMenuEvents() {
        const addMenuBtn = document.getElementById('add-menu-btn');
        const addContentMenu = document.getElementById('add-content-menu');
        
        if (!addMenuBtn || !addContentMenu) {
            console.log('添加菜单元素不存在，跳过绑定（可能不在主页面）');
            return;
        }
        
        console.log('绑定添加菜单事件...');
        
        // 点击添加按钮显示/隐藏菜单
        addMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('添加按钮被点击');
            this.toggleAddMenu();
        });

        // 点击菜单项目
        addContentMenu.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.add-menu-item');
            if (menuItem) {
                e.preventDefault();
                e.stopPropagation();
                const action = menuItem.dataset.action;
                console.log('菜单项被点击:', action);
                this.handleAddMenuAction(action);
                this.hideAddMenu();
            }
        });

        // 点击其他地方隐藏菜单
        document.addEventListener('click', (e) => {
            if (!addMenuBtn.contains(e.target) && !addContentMenu.contains(e.target)) {
                this.hideAddMenu();
            }
        });
        
        console.log('添加菜单事件绑定完成');
    }

    /**
     * 修复z-index问题并确保添加按钮菜单正确显�?
     */
    fixAddMenuZIndexIssues() {
        const addContentMenu = document.getElementById('add-content-menu');
        if (!addContentMenu) {
            console.log('添加菜单元素不存在，跳过修复');
            return;
        }
            
        // 修复z-index使其始终显示在上�?
        addContentMenu.style.zIndex = '1010';
        
        // 确保菜单定位正确，相对于其父容器
        const navActions = addContentMenu.closest('.nav-actions');
        if (navActions) {
            navActions.style.position = 'relative';
        }
        
        console.log('添加菜单z-index已修复');
    }

    /**
     * 切换添加内容菜单显示状�?
     */
    toggleAddMenu() {
        const addMenuBtn = document.getElementById('add-menu-btn');
        const addContentMenu = document.getElementById('add-content-menu');
        
        if (!addMenuBtn || !addContentMenu) {
            console.error('菜单元素未找到');
            return;
        }
        
        console.log('切换菜单显示状态，当前是否显示:', addContentMenu.classList.contains('show'));
        
        if (addContentMenu.classList.contains('show')) {
            this.hideAddMenu();
        } else {
            this.showAddMenu();
        }
    }

    /**
     * 显示添加内容菜单
     */
    showAddMenu() {
        const addMenuBtn = document.getElementById('add-menu-btn');
        const addContentMenu = document.getElementById('add-content-menu');
        
        if (!addMenuBtn || !addContentMenu) {
            console.error('无法找到菜单元素');
            return;
        }
        
        console.log('显示添加菜单');
        addMenuBtn.classList.add('active');
        addContentMenu.classList.add('show');
    }

    /**
     * 隐藏添加内容菜单
     */
    hideAddMenu() {
        const addMenuBtn = document.getElementById('add-menu-btn');
        const addContentMenu = document.getElementById('add-content-menu');
        
        if (!addMenuBtn || !addContentMenu) {
            return;
        }
        
        console.log('隐藏添加菜单');
        addMenuBtn.classList.remove('active');
        addContentMenu.classList.remove('show');
    }

    /**
     * 处理添加菜单动作
     */
    handleAddMenuAction(action) {
        switch (action) {
            case 'new-folder':
                this.showNewFolderModal();
                break;
            case 'import-text':
                this.showImportModal();
                break;
            case 'import-link':
                this.showImportFromLinkModal();
                break;
            case 'import-file':
                this.showImportFromFileModal();
                break;
        }
    }

    /**
     * 显示导入文稿弹窗
     */
    showImportModal() {
        if (window.app && window.app.modalManager) {
            window.app.modalManager.openModal('import-modal');
        } else {
            console.error('无法访问模态管理器');
        }
    }

    /**
     * 显示从链接导入弹�?
     */
    showImportFromLinkModal() {
        // 这里可以添加从链接导入的逻辑
        alert('从链接导入功能待实现');
    }

    /**
     * 显示从文件导入弹�?
     */
    showImportFromFileModal() {
        // 创建文件输入元素
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.txt,.md,.doc,.docx';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileImport(file);
            }
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }

    /**
     * 处理文件导入
     */
    handleFileImport(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const content = e.target.result;
            const title = file.name.replace(/\.[^/.]+$/, ""); // 移除文件扩展�?
            
            // 调用主应用的文档创建功能
            if (window.app && window.app.documentManager) {
                const newDoc = window.app.documentManager.createDocument(
                    title,
                    'English', // 默认语言
                    '', // 默认无标�?
                    content
                );
                
                // 刷新视图
                if (window.app.libraryRenderer) {
                    window.app.libraryRenderer.renderLibrary();
                }
            }
        };
        
        reader.readAsText(file, 'UTF-8');
    }

    /**
     * 显示导入文稿弹窗
     */
    showImportModal() {
        if (window.app && window.app.modalManager) {
            window.app.modalManager.openModal('import-modal');
        } else {
            console.error('无法访问模态管理器');
        }
    }

    /**
     * 导航到指定路�?
     */
    navigateTo(path) {
        if (path !== this.currentPath) {
            this.currentPath = path;
            this.addToHistory(path);
            this.updateUI();
        }
    }

    /**
     * 添加到导航历�?
     */
    addToHistory(path) {
        // 移除当前位置之后的历史记�?
        this.navigationHistory = this.navigationHistory.slice(0, this.historyIndex + 1);
        
        // 如果新路径不同于当前路径，添加到历史
        if (this.navigationHistory[this.navigationHistory.length - 1] !== path) {
            this.navigationHistory.push(path);
            this.historyIndex = this.navigationHistory.length - 1;
        }
    }

    /**
     * 后退
     */
    goBack() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.currentPath = this.navigationHistory[this.historyIndex];
            this.updateUI();
        }
    }

    /**
     * 前进
     */
    goForward() {
        if (this.historyIndex < this.navigationHistory.length - 1) {
            this.historyIndex++;
            this.currentPath = this.navigationHistory[this.historyIndex];
            this.updateUI();
        }
    }

    /**
     * 上级目录
     */
    goUp() {
        if (this.currentPath) {
            this.navigateTo('');
        }
    }

    /**
     * 创建新文件夹
     * @param {string} [folderName] - 可选，文件夹名称
     */
    async createNewFolder(folderName) {
        if (!folderName) {
            const input = document.getElementById('new-folder-input');
            folderName = input ? input.value.trim() : '';
        }
        if (!folderName) {
            alert('请输入文件夹名称');
            return false;
        }
        // 检查文件夹是否已存在
        const folderPath = this.currentPath ? `${this.currentPath}/${folderName}` : folderName;
        if (this.folders.has(folderPath)) {
            alert('文件夹已存在');
            return false;
        }
        // 创建文件夹
        this.folders.set(folderPath, {
            name: folderName,
            path: folderPath,
            parentPath: this.currentPath,
            createdAt: new Date().toISOString(),
            documentCount: 0
        });
        // 初始化文件夹的文档列表
        this.documents.set(folderPath, []);
        // 保存数据并更新UI
        await this.saveToDatabase();
        this.updateUI();
        this.hideNewFolderModal();
        console.log(`文件夹 ${folderName} 创建成功`);
        return true;
    }

    /**
     * 添加文档到文件夹
     */
    addDocumentToFolder(docId, folderPath) {
        if (!docId) {
            console.error('文档ID不能为空');
            return false;
        }

        // 确保文件夹路径存在于documents map�?
        if (!this.documents.has(folderPath)) {
            this.documents.set(folderPath, []);
        }

        // 获取目标文件夹的文档列表
        const targetDocs = this.documents.get(folderPath);
        
        // 检查文档是否已经在目标文件夹中
        if (targetDocs.includes(docId)) {
            console.log(`文档 ${docId} 已经在文件夹 ${folderPath || '根目录'} 中`);
            return true;
        }

        // 将文档添加到目标文件�?
        targetDocs.push(docId);
        this.documents.set(folderPath, targetDocs);

        // 更新文件夹的文档计数
        this.updateFolderDocumentCount(folderPath);

        // 保存数据
        this.saveToDatabase();

        console.log(`文档 ${docId} 已添加到文件夹 ${folderPath || '根目录'}`);
        return true;
    }

    /**
     * 从文件夹中移除文�?
     */
    removeDocumentFromFolder(docId, folderPath) {
        if (!docId) {
            console.error('文档ID不能为空');
            return false;
        }

        // 确保文件夹路径存�?
        if (!this.documents.has(folderPath)) {
            return false;
        }

        const docs = this.documents.get(folderPath);
        const index = docs.indexOf(docId);
        
        if (index !== -1) {
            docs.splice(index, 1);
            this.documents.set(folderPath, docs);
            
            // 更新文件夹的文档计数
            this.updateFolderDocumentCount(folderPath);
            
            // 保存数据
            this.saveToDatabase();
            
            console.log(`文档 ${docId} 已从文件夹 ${folderPath || '根目录'} 中移除`);
            return true;
        }

        return false;
    }

    /**
     * 移动文档到另一个文件夹
     */
    moveDocumentToFolder(docId, fromPath, toPath) {
        if (!docId) {
            console.error('文档ID不能为空');
            return false;
        }

        // 从源文件夹移�?
        const removed = this.removeDocumentFromFolder(docId, fromPath);
        if (!removed) {
            console.error(`无法从文件夹 ${fromPath || '根目录'} 中移除文档 ${docId}`);
            return false;
        }

        // 添加到目标文件夹
        const added = this.addDocumentToFolder(docId, toPath);
        if (!added) {
            // 如果添加失败，回滚移除操�?
            this.addDocumentToFolder(docId, fromPath);
            console.error(`无法将文档 ${docId} 添加到文件夹 ${toPath || '根目录'}`);
            return false;
        }

        console.log(`文档 ${docId} 已从 ${fromPath || '根目录'} 移动到 ${toPath || '根目录'}`);
        return true;
    }

    /**
     * 获取文件夹中的文档列�?
     */
    getDocumentsInFolder(folderPath) {
        return this.documents.get(folderPath) || [];
    }

    /**
     * 获取文档所在的文件夹路�?
     */
    getDocumentFolder(docId) {
        for (const [path, docs] of this.documents) {
            if (docs.includes(docId)) {
                return path;
            }
        }
        return null;
    }

    /**
     * 更新文件夹的文档计数
     */
    updateFolderDocumentCount(folderPath) {
        if (folderPath && this.folders.has(folderPath)) {
            const folder = this.folders.get(folderPath);
            const docs = this.documents.get(folderPath) || [];
            folder.documentCount = docs.length;
            this.folders.set(folderPath, folder);
        }
    }

    /**
     * 重命名文件夹
     */
    renameFolder(folderPath, newName) {
        if (!folderPath || !this.folders.has(folderPath)) {
            console.error('文件夹不存在');
            return false;
        }

        if (!newName || !newName.trim()) {
            console.error('文件夹名称不能为空');
            return false;
        }

        const trimmedName = newName.trim();
        const folder = this.folders.get(folderPath);
        
        // 检查新名称是否与同级文件夹重名
        const parentPath = folder.parentPath;
        for (const [path, folderInfo] of this.folders) {
            if (folderInfo.parentPath === parentPath && 
                folderInfo.name === trimmedName && 
                path !== folderPath) {
                console.error('文件夹名称已存在');
                return false;
            }
        }

        // 更新文件夹信�?
        folder.name = trimmedName;
        folder.updatedAt = new Date().toISOString();
        this.folders.set(folderPath, folder);

        // 保存数据
        this.saveToDatabase();

        console.log(`文件�?${folderPath} 已重命名�?${trimmedName}`);
        return true;
    }

    /**
     * 删除文件�?
     */
    deleteFolder(folderPath) {
        if (!folderPath || !this.folders.has(folderPath)) {
            console.error('文件夹不存在');
            return false;
        }

        const folder = this.folders.get(folderPath);
        
        // 获取文件夹中的文�?
        const docs = this.documents.get(folderPath) || [];
        
        // 如果文件夹中有文档，删除它们
        if (docs.length > 0) {
            // 从文档管理器中删除这些文�?
            if (window.app && window.app.documentManager) {
                docs.forEach(docId => {
                    window.app.documentManager.deleteDocument(docId);
                });
            }
        }

        // 删除文件夹的文档记录
        this.documents.delete(folderPath);
        
        // 删除文件夹本�?
        this.folders.delete(folderPath);

        // 保存数据
        this.saveToDatabase();

        console.log(`文件�?${folderPath} 及其内容已删除`);
        return true;
    }

    /**
     * 显示新建文件夹模态框
     */
    showNewFolderModal() {
        if (window.app && window.app.modalManager) {
            window.app.modalManager.openModal('new-folder-modal');
        } else {
            // 备用方案：使用原生prompt
            const folderName = prompt('请输入文件夹名称:');
            if (folderName && folderName.trim()) {
                this.createNewFolder(folderName.trim());
            }
        }
    }

    /**
     * 隐藏新建文件夹模态框
     */
    hideNewFolderModal() {
        if (window.app && window.app.modalManager) {
            window.app.modalManager.closeModal('new-folder-modal');
        }
        
        // 清空输入�?
        const input = document.getElementById('new-folder-input');
        if (input) {
            input.value = '';
        }
    }

    /**
     * 创建新文件夹（改进版�?
     */
    createNewFolder(folderName) {
        if (!folderName) {
            const input = document.getElementById('new-folder-input');
            folderName = input ? input.value.trim() : '';
        }
        
        if (!folderName) {
            alert('请输入文件夹名称');
            return false;
        }

        // 检查文件夹是否已存�?
        const folderPath = this.currentPath ? `${this.currentPath}/${folderName}` : folderName;
        if (this.folders.has(folderPath)) {
            alert('文件夹已存在');
            return false;
        }

        // 创建文件�?
        this.folders.set(folderPath, {
            name: folderName,
            path: folderPath,
            parentPath: this.currentPath,
            createdAt: new Date().toISOString(),
            documentCount: 0
        });

        // 初始化文件夹的文档列�?
        this.documents.set(folderPath, []);

        // 保存数据并更新UI
        this.saveToDatabase();
        this.updateUI();

        console.log(`文件�?${folderName} 创建成功`);
        return true;
    }

    /**
     * 获取当前路径下的文件夹列�?
     */
    getFoldersInCurrentPath() {
        const folders = [];
        for (const [path, folder] of this.folders) {
            if (folder.parentPath === this.currentPath) {
                folders.push(folder);
            }
        }
        return folders;
    }

    /**
     * 获取当前路径下的文档ID列表
     */
    getDocumentsInCurrentPath() {
        return this.documents.get(this.currentPath) || [];
    }

    /**
     * 获取所有文档的文件夹分布情�?
     */
    getAllDocumentDistribution() {
        const distribution = {};
        for (const [path, docs] of this.documents) {
            distribution[path] = docs.slice(); // 复制数组
        }
        return distribution;
    }

    /**
     * 检查文档是否在指定文件夹中
     */
    isDocumentInFolder(docId, folderPath) {
        const docs = this.documents.get(folderPath) || [];
        return docs.includes(docId);
    }

    /**
     * 获取文件夹的完整信息（包括文档数量）
     */
    getFolderInfo(folderPath) {
        if (!this.folders.has(folderPath)) {
            return null;
        }
        
        const folder = this.folders.get(folderPath);
        const docs = this.documents.get(folderPath) || [];
        
        return {
            ...folder,
            documentCount: docs.length,
            documents: docs.slice()
        };
    }

    /**
     * 添加文件夹到视图
     * @param {Object} folder - 文件夹对�?
     * @param {Element} gridView - 网格视图容器
     * @param {Element} listView - 列表视图容器
     */
    addFolderToView(folder, gridView, listView) {
        // 网格视图文件夹卡�?
        if (gridView) {
            const folderCard = document.createElement('div');
            folderCard.className = 'folder-card';
            folderCard.setAttribute('data-folder-path', folder.path);
            folderCard.innerHTML = `
                <div class="folder-content">
                    <div class="folder-icon">📁</div>
                    <div class="folder-name">${folder.name}</div>
                    <button class="folder-menu-btn" data-folder-path="${folder.path}" title="文件夹选项">�?/button>
                </div>
                <div class="folder-info">
                    ${folder.documentCount} 个文�?
                </div>
            `;

            // 绑定点击事件（排除菜单按钮）
            folderCard.addEventListener('click', (e) => {
                // 如果点击的是菜单按钮，不执行导航
                if (e.target.classList.contains('folder-menu-btn')) {
                    return;
                }
                // 只有在没有右键时才导�?
                if (e.button === 0) {
                    this.navigateTo(folder.path);
                }
            });

            gridView.appendChild(folderCard);
        }

        // 列表视图文件夹项
        if (listView) {
            const folderListItem = document.createElement('div');
            folderListItem.className = 'folder-list-item';
            folderListItem.setAttribute('data-folder-path', folder.path);
            folderListItem.innerHTML = `
                <div class="folder-list-icon">📁</div>
                <div class="folder-list-content">
                    <div class="folder-list-name">${folder.name}</div>
                    <div class="folder-list-info">${folder.documentCount} 个文�?/div>
                </div>
                <button class="folder-list-menu-btn" data-folder-path="${folder.path}" title="文件夹选项">�?/button>
            `;

            // 绑定点击事件（排除菜单按钮）
            folderListItem.addEventListener('click', (e) => {
                // 如果点击的是菜单按钮，不执行导航
                if (e.target.classList.contains('folder-list-menu-btn')) {
                    return;
                }
                // 只有在没有右键时才导�?
                if (e.button === 0) {
                    this.navigateTo(folder.path);
                }
            });

            listView.appendChild(folderListItem);
        }
    }

    /**
     * 更新UI显示
     */
    updateUI() {
        console.log('更新文件夹管理器UI');
        
        // 更新导航按钮状�?
        this.updateNavigationButtons();
        
        // 更新面包屑导�?
        this.updateBreadcrumb();
        
        // 更新书库视图
        this.updateLibraryView();
    }

    /**
     * 更新导航按钮状�?
     */
    updateNavigationButtons() {
        const backBtn = document.getElementById('nav-back-btn');
        const forwardBtn = document.getElementById('nav-forward-btn');
        const upBtn = document.getElementById('nav-up-btn');
        
        if (backBtn) {
            backBtn.disabled = this.historyIndex <= 0;
        }
        
        if (forwardBtn) {
            forwardBtn.disabled = this.historyIndex >= this.navigationHistory.length - 1;
        }
        
        if (upBtn) {
            upBtn.disabled = !this.currentPath;
        }
    }

    /**
     * 更新面包屑导�?
     */
    updateBreadcrumb() {
        const breadcrumb = document.getElementById('breadcrumb');
        if (!breadcrumb) return;

        let html = `<span class="breadcrumb-item ${!this.currentPath ? 'active' : ''}" data-path="">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            📚 我的书库
        </span>`;

        if (this.currentPath) {
            const pathParts = this.currentPath.split('/');
            let currentPath = '';
            
            pathParts.forEach((part, index) => {
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                const isActive = index === pathParts.length - 1;
                
                html += `<span class="breadcrumb-item ${isActive ? 'active' : ''}" data-path="${currentPath}">
                    📁 ${part}
                </span>`;
            });
        }

        breadcrumb.innerHTML = html;
    }

    /**
     * 更新书库视图
     */
    updateLibraryView() {
        // 使用应用的UI管理器来渲染库视�?
        if (window.app && window.app.uiManager) {
            window.app.uiManager.renderLibrary();
        }
    }

    /**
     * 使用数据库初始化
     */
    async initializeWithDatabase() {
        // 监听数据库就绪事�?
        document.addEventListener('databaseReady', async (event) => {
            this.databaseManager = event.detail.databaseManager;
            console.log('文件夹管理器：数据库已连接');
            
            await this.loadFromDatabase();
            this.bindEvents();
            this.updateUI();
        });
        
        // 如果数据库已经准备就�?
        if (window.dbManager) {
            this.databaseManager = window.dbManager;
            await this.loadFromDatabase();
            this.bindEvents();
            this.updateUI();
        }
    }

    /**
     * 从数据库加载数据
     */
    async loadFromDatabase() {
        try {
            if (!this.databaseManager) {
                console.warn('数据库管理器未准备就绪，使用本地存储');
                this.initializeDefaultStructure();
                return;
            }

            // 从数据库加载文件夹结�?
            const folderData = this.databaseManager.storageManager.load('folders', 'structure');
            if (folderData) {
                this.folders = new Map(folderData);
            }

            // 从数据库加载文档分布
            const documentDistribution = this.databaseManager.storageManager.load('folders', 'documents');
            if (documentDistribution) {
                this.documents = new Map();
                for (const [path, docList] of Object.entries(documentDistribution)) {
                    this.documents.set(path, docList);
                }
            } else {
                // 初始化根目录文档列表
                this.documents.set('', []);
            }

            console.log('从数据库加载文件夹数据完成');
        } catch (error) {
            console.error('从数据库加载文件夹数据失�?', error);
            this.initializeDefaultStructure();
        }
    }

    /**
     * 保存数据到数据库
     */
    async saveToDatabase() {
        try {
            if (!this.databaseManager) {
                console.warn('数据库管理器未准备就绪，保存到本地存储');
                this.saveData();
                return;
            }
            // 保存文件夹结构
            this.databaseManager.storageManager.save('folders', [...this.folders], 'structure');
            // 保存文档分布
            const docsObject = {};
            for (const [path, docs] of this.documents) {
                docsObject[path] = docs;
            }
            this.databaseManager.storageManager.save('folders', docsObject, 'documents');
            console.log('文件夹数据已保存到数据库');
        } catch (error) {
            console.error('保存文件夹数据到数据库失败', error);
            // 备用方案：保存到本地存储
            this.saveData();
        }
    }
}

// 导出到全局
window.FolderManager = FolderManager;
