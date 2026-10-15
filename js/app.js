/* Main application initialization */

/**
 * Initialize the application on page load
 */
function initApp() {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Initialize theme
    if (window.navigation && typeof window.navigation.initTheme === 'function') {
        window.navigation.initTheme();
    }

    // Initialize navigation (sets active link, etc.)
    if (window.navigation && typeof window.navigation.initNavigation === 'function') {
        window.navigation.initNavigation();
    }

    // Initialize storage (ensure data exists)
    if (window.storage && typeof window.storage.initStorage === 'function') {
        window.storage.initStorage();
    }
    updateProfileSummary();
    document.addEventListener('data:updated', updateProfileSummary);
    document.addEventListener('profile:updated', updateProfileSummary);

    // Dispatch a custom event to signal that app is initialized
    document.dispatchEvent(new CustomEvent('app:initialized'));
}

function updateProfileSummary() {
    const profile = utils.loadProfile();
    document.querySelectorAll('.profile-name').forEach(element => { element.textContent = profile.name; });
    document.querySelectorAll('.profile-avatar').forEach(element => {
        const initials = profile.name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('');
        element.textContent = profile.photo ? '' : (initials || 'S');
        element.style.backgroundImage = profile.photo ? `url("${profile.photo}")` : 'none';
        element.style.backgroundPosition = `${profile.photoPosition.x}% ${profile.photoPosition.y}%`;
        element.classList.toggle('has-photo', Boolean(profile.photo));
        element.setAttribute('aria-label', `${profile.name} profile picture`);
        element.removeAttribute('aria-hidden');
    });
    const balanceElements = document.querySelectorAll('.profile-balance');
    if (!balanceElements.length || !window.storage || !window.utils) return;
    const balance = storage.getTransactions().reduce((total, transaction) => {
        const amount = Number(transaction.amount);
        if (!Number.isFinite(amount)) return total;
        return total + (transaction.type === 'income' ? amount : -amount);
    }, 0);
    balanceElements.forEach(element => { element.textContent = utils.formatPHP(balance); });
}

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Export initApp for potential use in other modules (though it runs automatically)
window.initApp = initApp;
window.updateProfileSummary = updateProfileSummary;
