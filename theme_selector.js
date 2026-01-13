// Collapsible Section Toggle
window.toggleCollapsible = function (header) {
    const content = header.nextElementSibling;
    const isOpen = content.style.display === 'block';

    if (isOpen) {
        content.style.display = 'none';
        header.classList.remove('active');
    } else {
        content.style.display = 'block';
        header.classList.add('active');
    }
};

window.togglePanelCollapse = function (header) {
    console.log("Toggle panel collapse clicked:", header);
    const $section = $(header).closest('.collapsible-section');
    if ($section.length) {
        $section.toggleClass('collapsed');
        const isCollapsed = $section.hasClass('collapsed');
        console.log("Section", $section.attr('id'), "is now", isCollapsed ? "collapsed" : "expanded");
    }
};

// Dark/Light Mode Toggle
window.toggleThemeMode = function (isDark) {
    const root = document.documentElement;
    const icon = document.getElementById('theme-mode-icon');

    if (isDark) {
        // Dark mode (default)
        root.style.setProperty('--bg-main', '#0f0f0f');
        root.style.setProperty('--bg-side', '#1a1a1a');
        root.style.setProperty('--bg-panel', '#2a2a2a');
        root.style.setProperty('--bg-input', '#3a3a3a');
        root.style.setProperty('--text-primary', '#ffffff');
        root.style.setProperty('--text-secondary', '#b0b0b0');
        root.style.setProperty('--border', '#3a3a3a');
        icon.textContent = '🌙';
        localStorage.setItem('chess_theme_mode', 'dark');
    } else {
        // Light mode
        root.style.setProperty('--bg-main', '#f5f5f5');
        root.style.setProperty('--bg-side', '#ffffff');
        root.style.setProperty('--bg-panel', '#e8e8e8');
        root.style.setProperty('--bg-input', '#d0d0d0');
        root.style.setProperty('--text-primary', '#1a1a1a');
        root.style.setProperty('--text-secondary', '#4a4a4a');
        root.style.setProperty('--border', '#d0d0d0');
        icon.textContent = '☀️';
        localStorage.setItem('chess_theme_mode', 'light');
    }
};

// Initialize theme on load
$(document).ready(function () {
    const savedTheme = localStorage.getItem('chess_theme_mode') || 'dark';
    const isDark = savedTheme === 'dark';

    $('#theme-mode-toggle').prop('checked', isDark);
    toggleThemeMode(isDark);

    // Show/hide guest CTA banner based on auth status
    updateGuestBanner();
});

// Update Guest Banner Visibility
function updateGuestBanner() {
    const isAuth = localStorage.getItem('chess_is_auth') === 'true';
    const modalClosed = sessionStorage.getItem('guest_modal_closed') === 'true';

    if (!isAuth && !modalClosed) {
        // Show modal after a short delay for better UX
        setTimeout(() => {
            $('#guest-cta-modal').fadeIn();
        }, 2000);
    }
}

// Close Guest Modal
window.closeGuestModal = function () {
    $('#guest-cta-modal').fadeOut();
    // Remember that user closed it (don't show again this session)
    sessionStorage.setItem('guest_modal_closed', 'true');
};

// Make updateGuestBanner available globally
window.updateGuestBanner = updateGuestBanner;
