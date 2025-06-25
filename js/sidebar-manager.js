// ==================== 侧边栏菜单管理（仅保留弹窗相关） ====================

class SidebarManager {
    constructor(app) {
        this.app = app;
        this.currentDocId = null;
    }    // 仅用于弹窗重命名
    executeRename() {
        if (!this.currentDocId) return;

        const newTitle = document.getElementById('rename-input').value.trim();
        if (!newTitle) {
            alert('请输入有效的文档名称');
            return;
        }

        this.app.documentManager.updateDocument(this.currentDocId, {
            title: newTitle
        });

        // 根据当前视图模式刷新正确的视图
        if (this.app.state.libraryViewMode === 'list') {
            this.app.uiManager.renderLibraryList();
        } else {
            this.app.uiManager.renderLibrary();
        }
        
        this.app.modalManager.closeModal('rename-modal');
        
        // 如果当前正在阅读该文档，更新阅读器标题
        if (this.app.state.currentDocument && this.app.state.currentDocument.id === this.currentDocId) {
            const readerTitle = document.getElementById('reader-title');
            if (readerTitle) {
                readerTitle.textContent = newTitle;
            }
        }
    }    // 仅用于弹窗删除
    executeDelete() {
        if (!this.currentDocId) return;

        this.app.documentManager.deleteDocument(this.currentDocId);
        
        // 根据当前视图模式刷新正确的视图
        if (this.app.state.libraryViewMode === 'list') {
            this.app.uiManager.renderLibraryList();
        } else {
            this.app.uiManager.renderLibrary();
        }
        
        this.app.modalManager.closeModal('confirm-delete-modal');
    }

    // 设置当前操作的文档ID（供弹窗调用）
    setCurrentDocId(docId) {
        this.currentDocId = docId;
    }
}
