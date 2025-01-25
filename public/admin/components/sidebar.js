function createSidebar(currentPage) {
    return `
    <div class="sidebar">
        <div class="sidebar-header">
            <h1 class="sidebar-title">Admin Panel</h1>
        </div>
        <nav class="sidebar-nav">
            <a href="/admin" class="nav-item ${currentPage === 'dashboard' ? 'active' : ''}">
                <i class="fas fa-home"></i>
                Dashboard
            </a>
            <a href="/admin/blog" class="nav-item ${currentPage === 'blog' ? 'active' : ''}">
                <i class="fas fa-blog"></i>
                Blog
            </a>
            <a href="/admin/portfolio" class="nav-item ${currentPage === 'portfolio' ? 'active' : ''}">
                <i class="fas fa-folder-open"></i>
                Portfolio
            </a>
            <a href="/admin/messages" class="nav-item ${currentPage === 'messages' ? 'active' : ''}">
                <i class="fas fa-envelope"></i>
                Mesajlar
            </a>
            <a href="/admin/settings" class="nav-item ${currentPage === 'settings' ? 'active' : ''}">
                <i class="fas fa-cog"></i>
                Ayarlar
            </a>
            <a href="#" onclick="logout()" class="nav-item">
                <i class="fas fa-sign-out-alt"></i>
                Çıkış
            </a>
        </nav>
    </div>`;
} 