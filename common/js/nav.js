/**
 * 导航栏下拉菜单功能
 */
function initNavbar() {
    // 获取所有下拉菜单切换按钮
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    // 为每个切换按钮添加点击事件
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 切换下拉菜单的显示/隐藏
            const dropdown = this.closest('.dropdown');
            dropdown.classList.toggle('active');
        });
    });
    
    // 点击页面其他地方关闭下拉菜单
    document.addEventListener('click', function(e) {
        const dropdowns = document.querySelectorAll('.dropdown');
        dropdowns.forEach(dropdown => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    });
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initNavbar
    };
}
