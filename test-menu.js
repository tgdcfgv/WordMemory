// 测试加号按钮功能
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，开始测试加号按钮');
    
    const addMenuBtn = document.getElementById('add-menu-btn');
    const addContentMenu = document.getElementById('add-content-menu');
    
    console.log('元素检查:', {
        addMenuBtn: addMenuBtn,
        addContentMenu: addContentMenu,
        btnExists: !!addMenuBtn,
        menuExists: !!addContentMenu
    });
    
    if (addMenuBtn) {
        console.log('按钮样式:', window.getComputedStyle(addMenuBtn));
        
        // 添加测试点击事件
        addMenuBtn.addEventListener('click', function(e) {
            console.log('测试点击事件被触发', e);
        });
    }
    
    if (addContentMenu) {
        console.log('菜单样式:', {
            display: window.getComputedStyle(addContentMenu).display,
            visibility: window.getComputedStyle(addContentMenu).visibility,
            opacity: window.getComputedStyle(addContentMenu).opacity,
            zIndex: window.getComputedStyle(addContentMenu).zIndex,
            position: window.getComputedStyle(addContentMenu).position
        });
    }
});
