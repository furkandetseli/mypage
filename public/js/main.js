// Portfolio bölümü için
async function loadPortfolio() {
    try {
        const response = await fetch('/api/portfolio');
        if (!response.ok) throw new Error('Portfolio verileri yüklenemedi');
        
        const portfolios = await response.json();
        const portfolioSection = document.querySelector('#portfolio .portfolio-grid');
        
        if (!portfolioSection) {
            console.error('#portfolio .portfolio-grid elementi bulunamadı');
            return;
        }

        if (portfolios.length === 0) {
            portfolioSection.innerHTML = '<p class="text-center">Henüz proje eklenmemiş.</p>';
            return;
        }

        portfolioSection.innerHTML = portfolios.map(project => `
            <div class="portfolio-item ${project.featured ? 'featured' : ''}">
                <div class="portfolio-content">
                    ${project.image ? `
                        <div class="portfolio-image">
                            <img src="${project.image}" alt="${project.title}">
                        </div>
                    ` : ''}
                    <div class="portfolio-info">
                        <h3>${project.title}</h3>
                        <p>${project.description}</p>
                        <div class="tech-stack">
                            ${project.technologies.split(',').map(tech => 
                                `<span class="tech-tag">${tech.trim()}</span>`
                            ).join('')}
                        </div>
                        <div class="portfolio-links">
                            ${project.github ? `
                                <a href="${project.github}" target="_blank" rel="noopener noreferrer" class="github-link">
                                    <i class="fab fa-github"></i> GitHub
                                </a>
                            ` : ''}
                            ${project.link ? `
                                <a href="${project.link}" target="_blank" rel="noopener noreferrer" class="live-link">
                                    <i class="fas fa-external-link-alt"></i> Canlı
                                </a>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Portfolio yükleme hatası:', error);
    }
}

// Sayfa yüklendiğinde çalıştır
document.addEventListener('DOMContentLoaded', () => {
    loadPortfolio();
}); 