// ==================== 模态弹窗管理 ====================

class ModalManager {
    constructor(app) {
        this.app = app;
        this.openModals = new Set();
        this.setupEventListeners();
    }    setupEventListeners() {
        // 重命名弹窗
        const closeRenameBtn = document.getElementById('close-rename-modal');
        if (closeRenameBtn) {
            closeRenameBtn.addEventListener('click', () => 
                this.closeModal('rename-modal'));
        }
        
        const cancelRenameBtn = document.getElementById('cancel-rename-btn');
        if (cancelRenameBtn) {
            cancelRenameBtn.addEventListener('click', () => 
                this.closeModal('rename-modal'));
        }
        
        // 重命名输入框回车确认
        const renameInput = document.getElementById('rename-input');
        if (renameInput) {
            renameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.app.sidebarManager?.executeRename();
                }
            });
        }
        
        // 点击外部关闭重命名弹窗
        const renameModal = document.getElementById('rename-modal');
        if (renameModal) {
            renameModal.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    this.closeModal('rename-modal');
                }
            });
        }
        
        const confirmRenameBtn = document.getElementById('confirm-rename-btn');
        if (confirmRenameBtn) {
            confirmRenameBtn.addEventListener('click', () => 
                this.app.sidebarManager?.executeRename());
        }
        
        // 删除确认弹窗
        const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', () => 
                this.closeModal('confirm-delete-modal'));
        }
        
        const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => 
                this.app.sidebarManager?.executeDelete());
        }

        // 点击外部关闭删除确认弹窗
        const confirmDeleteModal = document.getElementById('confirm-delete-modal');
        if (confirmDeleteModal) {
            confirmDeleteModal.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    this.closeModal('confirm-delete-modal');
                }
            });
        }        // 导入弹窗
        const importModal = document.getElementById('import-modal');
        if (importModal) {
            importModal.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    this.app.uiManager?.closeImportModal();
                }
            });
        }

        // 设置弹窗
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    this.app.uiManager?.closeSettingsModal();
                }
            });
        }        // ESC键关闭所有弹窗
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.openModals.size > 0) {
                e.preventDefault();
                // 关闭最后打开的弹窗
                const modalsArray = Array.from(this.openModals);
                const lastModal = modalsArray[modalsArray.length - 1];
                
                // 对于不同类型的弹窗使用相应的关闭方法
                if (lastModal === 'import-modal') {
                    this.app.uiManager?.closeImportModal();
                } else if (lastModal === 'settings-modal') {
                    this.app.uiManager?.closeSettingsModal();
                } else {
                    this.closeModal(lastModal);
                }
            }
        });
        
        // 新建文件夹弹窗
        const newFolderModal = document.getElementById('new-folder-modal');
        if (newFolderModal) {
            newFolderModal.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    if (window.app && window.app.folderManager) {
                        window.app.folderManager.hideNewFolderModal();
                    } else {
                        this.closeModal('new-folder-modal');
                    }
                }
            });
        }
    }    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.add('active');
        this.openModals.add(modalId);

        // 禁用页面滚动
        document.body.style.overflow = 'hidden';
    }    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // 添加关闭动画状态
        modal.classList.add('closing');
        modal.classList.remove('active');
        this.openModals.delete(modalId);

        // 等待动画完成后移除关闭状态
        setTimeout(() => {
            modal.classList.remove('closing');
        }, 300);

        // 如果没有其他弹窗打开，延迟恢复页面滚动（等待动画完成）
        if (this.openModals.size === 0) {
            setTimeout(() => {
                document.body.style.overflow = '';
            }, 300); // 与CSS动画时间保持一致
        }
    }

    closeAllModals() {
        this.openModals.forEach(modalId => {
            this.closeModal(modalId);
        });
        document.body.style.overflow = '';
    }

    isAnyModalOpen() {
        return this.openModals.size > 0;
    }
}
