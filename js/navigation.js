/* Navigation handling */

/**
 * Set active navigation link based on current page
 */
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    // Remove .html for matching data-page attribute
    const pageName = currentPage.replace('.html', '');

    // Map filename to data-page value
    const pageMap = {
        'index': 'overview',
        'transactions': 'transactions',
        'budgets': 'budgets',
        'savings': 'savings',
        'reports': 'reports',
        'settings': 'settings',
        'help': 'help'
    };

    const targetPage = pageMap[pageName] || pageName;

    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Add active class to the matching nav link
    const activeLink = document.querySelector(`.nav-link[data-page="${targetPage}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

/**
 * Initialize sidebar toggle for mobile (if we implement a collapsible sidebar)
 * For now, we'll just set the active link on load.
 */
function initNavigation() {
    setActiveNavLink();

    // Handle theme toggle button if present
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
    const htmlElement = document.documentElement;
    const isDark = htmlElement.classList.toggle('dark');
    // Save preference to localStorage
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    // Update icon
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const icon = themeToggleBtn && themeToggleBtn.querySelector('i');
    if (icon) {
        icon.dataset.lucide = isDark ? 'sun' : 'moon';
        lucide.createIcons();
    }
    document.dispatchEvent(new CustomEvent('theme:changed'));
}

/**
 * Initialize theme from saved preference
 */
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const htmlElement = document.documentElement;
    const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
        htmlElement.classList.add('dark');
    } else {
        htmlElement.classList.remove('dark');
    }

    // Set initial icon
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        const icon = themeToggleBtn.querySelector('i');
        if (icon) {
            icon.dataset.lucide = htmlElement.classList.contains('dark') ? 'sun' : 'moon';
            lucide.createIcons();
        }
    }
}

// Export navigation functions for use in other modules
window.navigation = {
    setActiveNavLink,
    initNavigation,
    toggleTheme,
    initTheme
};
