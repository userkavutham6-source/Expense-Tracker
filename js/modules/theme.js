/**
 * Dark/Light Theme Management
 */

export const initTheme = () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement;
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');

    // Check local storage or system preference
    const savedTheme = localStorage.getItem('smarttrack_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let currentTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

    const applyTheme = (theme) => {
        htmlEl.setAttribute('data-theme', theme);
        localStorage.setItem('smarttrack_theme', theme);
        
        if (theme === 'dark') {
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        } else {
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        }

        // Dispatch event for charts to update colors
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    };

    // Initial apply
    applyTheme(currentTheme);

    // Toggle event
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(currentTheme);
        });
    }
};

export const getThemeColors = () => {
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    const computedStyle = getComputedStyle(document.documentElement);
    
    return {
        theme,
        textPrimary: computedStyle.getPropertyValue('--text-primary').trim() || (theme === 'dark' ? '#f8fafc' : '#0f172a'),
        textSecondary: computedStyle.getPropertyValue('--text-secondary').trim() || (theme === 'dark' ? '#94a3b8' : '#475569'),
        borderColor: computedStyle.getPropertyValue('--border-color').trim() || (theme === 'dark' ? '#334155' : '#e2e8f0'),
        gridColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
    };
};
