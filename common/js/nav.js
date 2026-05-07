(function () {
    'use strict';

    function initSidebar() {
        var sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        var brandLink = sidebar.querySelector('.sidebar-brand a');
        var brand = sidebar.querySelector('.sidebar-brand');

        // Wrap brand text in span (for collapse hiding)
        if (brandLink && !brandLink.querySelector('.brand-text')) {
            var icon = brandLink.querySelector('.brand-icon');
            var textNode = icon ? icon.nextSibling : brandLink.firstChild;
            while (textNode) {
                if (textNode.nodeType === 3 && textNode.textContent.trim()) {
                    var span = document.createElement('span');
                    span.className = 'brand-text';
                    span.textContent = textNode.textContent.trim();
                    textNode.replaceWith(span);
                    break;
                }
                textNode = textNode.nextSibling;
            }
        }

        // Add toggle button
        if (brand && !brand.querySelector('.sidebar-toggle-btn')) {
            var btn = document.createElement('button');
            btn.className = 'sidebar-toggle-btn';
            btn.title = '折叠导航栏';
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            brand.appendChild(btn);

            // Restore saved state
            var collapsed = localStorage.getItem('sidebar-collapsed') === 'true';
            if (collapsed) {
                sidebar.classList.add('collapsed');
            }

            // Toggle on click
            btn.addEventListener('click', function () {
                sidebar.classList.toggle('collapsed');
                var isCollapsed = sidebar.classList.contains('collapsed');
                localStorage.setItem('sidebar-collapsed', isCollapsed);
                btn.title = isCollapsed ? '展开导航栏' : '折叠导航栏';
            });
        }

        // Mobile: close sidebar on link click
        sidebar.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                    var overlay = document.getElementById('sidebarOverlay');
                    if (overlay) overlay.classList.remove('show');
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSidebar);
    } else {
        initSidebar();
    }
})();
