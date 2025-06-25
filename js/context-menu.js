// 卡片上下文菜单管理
document.addEventListener('DOMContentLoaded', function() {
    console.log('初始化上下文菜单管理');
    
    // 创建单个全局菜单元素
    const contextMenu = document.createElement('div');
    contextMenu.id = 'global-context-menu';
    contextMenu.className = 'card-context-menu';
    contextMenu.style.display = 'none';

    contextMenu.innerHTML = `
        <div class="color-section">
            <div class="color-option default" data-color="default" title="默认"></div>
            <div class="color-option blue" data-color="blue" title="蓝色"></div>
            <div class="color-option green" data-color="green" title="绿色"></div>
            <div class="color-option purple" data-color="purple" title="紫色"></div>
            <div class="color-option orange" data-color="orange" title="橙色"></div>
            <div class="color-option pink" data-color="pink" title="粉色"></div>
            <div class="color-option custom" id="custom-color-block" title="自定义颜色"></div>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" id="add-to-folder-btn">
            <span class="menu-icon">📁</span>
            <span class="menu-text">加入文件夹</span>
            <span class="menu-arrow">▶</span>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" id="rename-btn">
            <span class="menu-icon">✏️</span>
            <span class="menu-text">编辑导入文本</span>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item danger" id="delete-btn">
            <span class="menu-icon">🗑️</span>
            <span class="menu-text">删除</span>
        </div>
    `;
    document.body.appendChild(contextMenu);
    
    // 创建文件夹上下文菜单
    const folderContextMenu = document.createElement('div');
    folderContextMenu.id = 'folder-context-menu';
    folderContextMenu.className = 'card-context-menu';
    folderContextMenu.style.display = 'none';
    
    folderContextMenu.innerHTML = `
        <div class="menu-item" id="open-folder-btn">
            <span class="menu-icon">📂</span>
            <span class="menu-text">打开</span>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" id="rename-folder-btn">
            <span class="menu-icon">✏️</span>
            <span class="menu-text">重命名</span>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item danger" id="delete-folder-btn">
            <span class="menu-icon">🗑️</span>
            <span class="menu-text">删除</span>
        </div>
    `;
    document.body.appendChild(folderContextMenu);
    
    // 创建文件夹选择子菜单
    const folderSelectMenu = document.createElement('div');
    folderSelectMenu.id = 'folder-select-menu';
    folderSelectMenu.className = 'card-context-menu folder-select-submenu';
    folderSelectMenu.style.display = 'none';
    
    folderSelectMenu.innerHTML = `
        <div class="menu-header">
            <span class="menu-icon">←</span>
            <span class="menu-text">选择文件夹</span>
        </div>
        <div class="menu-divider"></div>
        <div class="folder-list" id="folder-list-menu">
            <!-- 动态生成文件夹列表 -->
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" id="create-new-folder-menu">
            <span class="menu-icon">➕</span>
            <span class="menu-text">新建文件夹</span>
        </div>
    `;
    document.body.appendChild(folderSelectMenu);
    
    console.log('全局上下文菜单已创建', contextMenu);
    console.log('文件夹上下文菜单已创建', folderContextMenu);
    
    // 当前操作的文档ID和文件夹路径
    let currentDocId = null;
    let currentFolderPath = null;    // 菜单按钮点击事件代理
    document.addEventListener('click', function(e) {
        // 点击菜单按钮时显示菜单（支持卡片和列表）
        if (e.target.classList.contains('card-menu-btn') || e.target.classList.contains('list-item-menu-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const btn = e.target;
            const docId = btn.getAttribute('data-doc-id') || 
                         btn.closest('[data-doc-id]')?.getAttribute('data-doc-id');
            if (docId) {
                // 检查是否在列表视图中
                const libraryList = document.getElementById('library-list');
                const isListView = libraryList && libraryList.style.display !== 'none';
                
                showMenu(docId, btn, isListView);
                console.log('菜单按钮被点击', docId, '列表视图:', isListView);
            }
        }
        // 文件夹菜单按钮点击事件
        else if (e.target.classList.contains('folder-menu-btn') || e.target.classList.contains('folder-list-menu-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const btn = e.target;
            const folderPath = btn.getAttribute('data-folder-path') || 
                              btn.closest('[data-folder-path]')?.getAttribute('data-folder-path');
            if (folderPath !== null) {
                showFolderMenu(folderPath, btn);
                console.log('文件夹菜单按钮被点击', folderPath);
            }
        }
        // 点击其他区域时隐藏菜单
        else if (!e.target.closest('.card-context-menu')) {
            hideMenu();
            hideFolderMenu();
            hideFolderSelectMenu();
        }
    });
    
    // 注释：移除右键菜单事件处理，改为按钮点击逻辑
    // 原来的 contextmenu 事件已被移除，文件夹菜单现在通过按钮触发// 显示菜单
    function showMenu(docId, button, isListView = false) {
        currentDocId = docId;
        console.log('显示菜单', docId, '列表视图:', isListView);// 高亮当前颜色
        let currentColor = 'default'; // 默认颜色
        if (window.app && window.app.documentManager) {
            const doc = window.app.documentManager.getDocument(docId);
            if (doc && doc.cardColor) {
                currentColor = doc.cardColor;
            }
        }
          console.log('当前文档颜色:', currentColor);
        console.log('可用颜色选项:', contextMenu.querySelectorAll('.color-option'));
        
        // 清除所有选中状态
        contextMenu.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
            console.log('清除选中状态:', option.getAttribute('data-color') || 'custom');
        });
          // 根据当前颜色高亮对应选项
        const presetColors = ['default', 'blue', 'green', 'purple', 'orange', 'pink'];
        const customOption = contextMenu.querySelector('.color-option.custom');
          if (presetColors.includes(currentColor)) {
            // 预设颜色
            const targetOption = contextMenu.querySelector(`[data-color="${currentColor}"]`);
            if (targetOption) {
                targetOption.classList.add('selected');
                console.log('高亮预设颜色:', currentColor);
            } else {
                console.log('未找到预设颜色选项:', currentColor);
            }
            // 重置自定义颜色块样式
            if (customOption) {
                customOption.style.background = '';
                customOption.classList.remove('selected');
            }
        } else if (currentColor && currentColor.startsWith('#')) {
            // 自定义颜色
            if (customOption) {
                customOption.classList.add('selected');
                customOption.style.background = currentColor;
                console.log('高亮自定义颜色:', currentColor);
            }
        } else {
            // 重置自定义颜色块样式
            if (customOption) {
                customOption.style.background = '';
                customOption.classList.remove('selected');
            }
            console.log('使用默认颜色设置');
        }
        
        console.log('当前颜色:', currentColor);        const rect = button.getBoundingClientRect();
        contextMenu.style.position = 'fixed';
        contextMenu.style.left = `${rect.left}px`;
        contextMenu.style.top = `${rect.bottom + 4}px`;
        contextMenu.style.display = 'block';
        
        // 确保在视窗内 - 改进版本
        setTimeout(() => {
            const menuRect = contextMenu.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const padding = 10; // 距离边缘的最小距离
            
            // 水平位置调整
            if (menuRect.right > viewportWidth - padding) {
                // 右侧超出，尝试向左对齐按钮
                const newLeft = rect.right - menuRect.width;
                if (newLeft >= padding) {
                    contextMenu.style.left = `${newLeft}px`;
                } else {
                    // 如果左对齐也超出，则贴右边
                    contextMenu.style.left = `${viewportWidth - menuRect.width - padding}px`;
                }
            }
            
            // 左侧超出检查
            if (menuRect.left < padding) {
                contextMenu.style.left = `${padding}px`;
            }
            
            // 垂直位置调整
            if (menuRect.bottom > viewportHeight - padding) {
                // 底部超出，显示在按钮上方
                const newTop = rect.top - menuRect.height - 4;
                if (newTop >= padding) {
                    contextMenu.style.top = `${newTop}px`;
                } else {
                    // 如果上方也放不下，显示在视窗顶部
                    contextMenu.style.top = `${padding}px`;
                }
            }
            
            // 顶部超出检查
            if (menuRect.top < padding) {
                contextMenu.style.top = `${padding}px`;
            }
        }, 0);
    }
      // 隐藏菜单
    function hideMenu() {
        contextMenu.style.display = 'none';
        currentDocId = null;
    }
    
    // 显示文件夹菜单
    function showFolderMenu(folderPath, button) {
        currentFolderPath = folderPath;
        console.log('显示文件夹菜单', folderPath);
        
        // 隐藏其他菜单
        hideMenu();
        hideFolderSelectMenu();
        
        // 定位菜单（基于按钮位置）
        const rect = button.getBoundingClientRect();
        folderContextMenu.style.position = 'fixed';
        folderContextMenu.style.left = `${rect.left}px`;
        folderContextMenu.style.top = `${rect.bottom + 4}px`;
        folderContextMenu.style.display = 'block';
        
        // 确保在视窗内
        setTimeout(() => {
            const menuRect = folderContextMenu.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const padding = 10;
            
            // 水平位置调整
            if (menuRect.right > viewportWidth - padding) {
                const newLeft = rect.right - menuRect.width;
                if (newLeft >= padding) {
                    folderContextMenu.style.left = `${newLeft}px`;
                } else {
                    folderContextMenu.style.left = `${viewportWidth - menuRect.width - padding}px`;
                }
            }
            
            // 左侧超出检查
            if (menuRect.left < padding) {
                folderContextMenu.style.left = `${padding}px`;
            }
            
            // 垂直位置调整
            if (menuRect.bottom > viewportHeight - padding) {
                const newTop = rect.top - menuRect.height - 4;
                if (newTop >= padding) {
                    folderContextMenu.style.top = `${newTop}px`;
                } else {
                    folderContextMenu.style.top = `${padding}px`;
                }
            }
            
            // 顶部超出检查
            if (menuRect.top < padding) {
                folderContextMenu.style.top = `${padding}px`;
            }
        }, 0);
    }
    
    // 隐藏文件夹菜单
    function hideFolderMenu() {
        folderContextMenu.style.display = 'none';
        currentFolderPath = null;
    }
    
    // 显示文件夹选择菜单
    function showFolderSelectMenu(sourceEvent) {
        console.log('显示文件夹选择菜单');
        
        // 不隐藏一级菜单，只隐藏其他二级菜单
        // hideMenu(); // 注释掉这行，保持一级菜单显示
        
        // 获取所有文件夹
        const folders = window.app?.folderManager?.folders || new Map();
        const folderListMenu = document.getElementById('folder-list-menu');
        
        // 清空现有列表
        folderListMenu.innerHTML = '';
        
        // 添加根目录选项
        const rootItem = document.createElement('div');
        rootItem.className = 'folder-list-item-menu';
        rootItem.innerHTML = `
            <span class="folder-item-icon">🏠</span>
            <span class="folder-item-name">我的书库</span>
        `;
        rootItem.addEventListener('click', () => {
            addDocumentToFolder(currentDocId, '');
            hideFolderSelectMenu();
        });
        folderListMenu.appendChild(rootItem);
        
        // 添加现有文件夹
        for (const [path, folder] of folders) {
            const folderItem = document.createElement('div');
            folderItem.className = 'folder-list-item-menu';
            folderItem.innerHTML = `
                <span class="folder-item-icon">📁</span>
                <span class="folder-item-name">${folder.name}</span>
            `;
            folderItem.addEventListener('click', () => {
                addDocumentToFolder(currentDocId, path);
                hideFolderSelectMenu();
            });
            folderListMenu.appendChild(folderItem);
        }
        
        // 定位菜单（显示在一级菜单右侧）
        const contextMenuRect = contextMenu.getBoundingClientRect();
        folderSelectMenu.style.position = 'fixed';
        folderSelectMenu.style.left = `${contextMenuRect.right + 8}px`;
        folderSelectMenu.style.top = `${contextMenuRect.top}px`;
        folderSelectMenu.style.display = 'block';
        
        // 确保在视窗内
        setTimeout(() => {
            const menuRect = folderSelectMenu.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const padding = 10;
            
            // 水平位置调整
            if (menuRect.right > viewportWidth - padding) {
                // 如果右侧超出，显示在一级菜单左侧
                const newLeft = contextMenuRect.left - menuRect.width - 8;
                if (newLeft >= padding) {
                    folderSelectMenu.style.left = `${newLeft}px`;
                } else {
                    folderSelectMenu.style.left = `${padding}px`;
                }
            }
            
            // 垂直位置调整
            if (menuRect.bottom > viewportHeight - padding) {
                const newTop = viewportHeight - menuRect.height - padding;
                if (newTop >= padding) {
                    folderSelectMenu.style.top = `${newTop}px`;
                } else {
                    folderSelectMenu.style.top = `${padding}px`;
                }
            }
        }, 0);
    }
    
    // 隐藏文件夹选择菜单
    function hideFolderSelectMenu() {
        folderSelectMenu.style.display = 'none';
    }
    
    // 将文档添加到文件夹
    function addDocumentToFolder(docId, folderPath) {
        if (!docId) {
            console.error('文档ID不能为空');
            return;
        }
        
        if (!window.app?.folderManager) {
            console.error('文件夹管理器未初始化');
            return;
        }
        
        console.log('添加文档到文件夹', docId, folderPath);
        
        // 从当前位置移除文档
        const currentPath = window.app.folderManager.currentPath;
        const removed = window.app.folderManager.removeDocumentFromFolder(docId, currentPath);
        
        // 添加到新文件夹
        const added = window.app.folderManager.addDocumentToFolder(docId, folderPath);
        
        if (added) {
            // 更新UI
            window.app.folderManager.updateUI();
            console.log(`文档 ${docId} 已移动到文件夹 ${folderPath || '根目录'}`);
            
            // 隐藏菜单
            hideMenu();
            hideFolderSelectMenu();
        } else {
            console.error('添加文档到文件夹失败');
        }
    }    // 颜色选择
    contextMenu.querySelectorAll('.color-option:not(.custom)').forEach(option => {
        option.addEventListener('click', function(e) {
            if (!currentDocId) return;
            
            // 清除所有高亮
            contextMenu.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
            
            // 重置自定义颜色块样式
            const customOption = contextMenu.querySelector('.color-option.custom');
            if (customOption) {
                customOption.style.background = '';
            }
            
            // 高亮当前选择
            this.classList.add('selected');
            
            const color = this.getAttribute('data-color');
            console.log('选择颜色', color, '文档ID', currentDocId);
            
            if (window.app) {
                window.app.changeCardColor(currentDocId, color);
            }
            hideMenu();
        });
    });
    
    // 加入文件夹按钮
    document.getElementById('add-to-folder-btn').addEventListener('click', function(e) {
        if (!currentDocId) return;
        
        console.log('点击加入文件夹', currentDocId);
        showFolderSelectMenu(e);
    });
      // 自定义颜色选择器
    const customColorBlock = document.getElementById('custom-color-block');
    customColorBlock.addEventListener('click', function(e) {
        e.stopPropagation();
        
        console.log('点击自定义颜色块');
        
        if (!currentDocId) {
            console.log('错误: 没有当前文档ID');
            return;
        }
          // 获取当前颜色
        let currentColor = '#6366f1';
        if (window.app && window.app.documentManager) {
            const doc = window.app.documentManager.getDocument(currentDocId);
            if (doc && doc.cardColor && doc.cardColor.startsWith('#')) {
                currentColor = doc.cardColor;
            }
        }
        
        console.log('准备显示自定义颜色选择器，当前颜色:', currentColor);
        
        // 显示自定义颜色选择器
        if (window.customColorPicker) {
            console.log('找到自定义颜色选择器实例');
            window.customColorPicker.show(currentColor, {
                onSave: (selectedColor) => {
                    console.log('自定义颜色选择:', selectedColor, '文档ID:', currentDocId);
                    
                    // 清除所有高亮
                    contextMenu.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
                    
                    // 高亮自定义颜色选项
                    customColorBlock.classList.add('selected');
                    customColorBlock.style.background = selectedColor;
                    
                    if (window.app) {
                        window.app.changeCardColor(currentDocId, selectedColor);
                    }
                    hideMenu();
                },
                onCancel: () => {
                    console.log('取消自定义颜色选择');
                }
            });
        } else {
            console.log('错误: 未找到自定义颜色选择器实例');
        }
    });
      // 编辑导入文本按钮
    document.getElementById('rename-btn').addEventListener('click', function() {
        if (!currentDocId || !window.app) return;
        
        // 获取文档数据
        const doc = window.app.documentManager.getDocument(currentDocId);
        if (!doc) return;
        
        // 设置编辑模式
        window.app.uiManager.editingDocId = currentDocId;
        
        // 填充导入弹窗的表单
        document.getElementById('doc-title').value = doc.title;
        document.getElementById('doc-lang').value = doc.language;
        document.getElementById('doc-tags').value = doc.tags.join(', ');
        document.getElementById('doc-content').value = doc.content;
        
        // 修改模态框标题和按钮文字
        const modalTitle = document.querySelector('#import-modal h2');
        const submitBtn = document.querySelector('#import-form button[type="submit"]');
        if (modalTitle) modalTitle.textContent = '编辑导入文本';
        if (submitBtn) submitBtn.textContent = '确认修改';
        
        // 打开导入弹窗
        window.app.modalManager.openModal('import-modal');
        
        hideMenu();
    });
      // 删除按钮
    document.getElementById('delete-btn').addEventListener('click', function() {
        if (!currentDocId || !window.app) return;
        
        window.app.sidebarManager.setCurrentDocId(currentDocId);
        
        const doc = window.app.documentManager.getDocument(currentDocId);
        if (doc) {
            document.getElementById('confirm-message').textContent = 
                `您即将删除\"${doc.title}\"，此操作无法撤销。`;
        }
        
        window.app.modalManager.openModal('confirm-delete-modal');
        hideMenu();
    });
    
    // 文件夹菜单事件处理器
    
    // 打开文件夹
    document.getElementById('open-folder-btn').addEventListener('click', function() {
        if (!currentFolderPath || !window.app?.folderManager) return;
        
        window.app.folderManager.navigateTo(currentFolderPath);
        hideFolderMenu();
    });
    
    // 重命名文件夹
    document.getElementById('rename-folder-btn').addEventListener('click', function() {
        if (!currentFolderPath || !window.app?.folderManager) return;
        
        const folder = window.app.folderManager.folders.get(currentFolderPath);
        if (!folder) return;
        
        const newName = prompt('请输入新的文件夹名称:', folder.name);
        if (newName && newName.trim() && newName.trim() !== folder.name) {
            window.app.folderManager.renameFolder(currentFolderPath, newName.trim());
        }
        
        hideFolderMenu();
    });
    
    // 删除文件夹
    document.getElementById('delete-folder-btn').addEventListener('click', function() {
        if (!currentFolderPath || !window.app?.folderManager) return;
        
        const folder = window.app.folderManager.folders.get(currentFolderPath);
        if (!folder) return;
        
        if (confirm(`确定要删除文件夹 "${folder.name}" 吗？文件夹内的所有文档也会被删除。`)) {
            window.app.folderManager.deleteFolder(currentFolderPath);
        }
        
        hideFolderMenu();
    });
    
    // 文件夹选择菜单事件处理器
    
    // 返回主菜单
    document.querySelector('#folder-select-menu .menu-header').addEventListener('click', function() {
        hideFolderSelectMenu();
        // 一级菜单保持显示，不需要重新显示
    });
    
    // 新建文件夹
    document.getElementById('create-new-folder-menu').addEventListener('click', function() {
        if (!window.app?.folderManager) return;
        
        hideFolderSelectMenu();
        window.app.folderManager.showNewFolderModal();
    });
});

// ==================== 文件夹上下文菜单管理 ==================== 
// 文件夹菜单已改为按钮点击逻辑，取消了右键行为
// 文件夹卡片和列表项现在都有菜单按钮(.folder-menu-btn 和 .folder-list-menu-btn)
// 文件夹菜单内容和文件菜单内容已区分，分别用 folderContextMenu 和 contextMenu 控制
