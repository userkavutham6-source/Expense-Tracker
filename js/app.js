/**
 * Main Application Entry Point
 */
import { store } from './modules/store.js';
import { router } from './modules/router.js';
import { initTheme } from './modules/theme.js';
import { loadProfiles } from './modules/profiles.js';
import { processRecurringExpenses } from './modules/recurring.js';

// Views
import { renderDashboard } from './components/dashboard.js';
import { renderExpenses, showExpenseModal } from './components/expenses.js';
import { renderBudgets } from './components/budgets.js';
import { renderAnalytics } from './components/analytics.js';
import { renderSettings } from './components/settings.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Initialize Theme
        initTheme();

        // 2. Initialize Store (loads data from IndexedDB)
        await store.init();
        
        // 3. Process recurring expenses (creates new ones if due)
        await processRecurringExpenses();

        // 4. Initialize Profile Selector
        loadProfiles();

        // 5. Setup Routes
        router.addRoute('/', 'Dashboard', renderDashboard);
        router.addRoute('/expenses', 'Expenses', renderExpenses);
        router.addRoute('/budgets', 'Budgets', renderBudgets);
        router.addRoute('/analytics', 'Analytics', renderAnalytics);
        router.addRoute('/settings', 'Settings', renderSettings);

        // 6. Start Router
        router.init();

        // 7. Global Event Listeners
        setupGlobalListeners();

        // 8. Register Service Worker for PWA
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js').then(registration => {
                    console.log('SW registered: ', registration.scope);
                }).catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
            });
        }

    } catch (error) {
        console.error("Failed to initialize app:", error);
        document.getElementById('view-container').innerHTML = `
            <div class="card" style="text-align: center; color: var(--danger);">
                <h2>Initialization Error</h2>
                <p>Failed to load application data. Please check console for details.</p>
            </div>
        `;
    }
});

function setupGlobalListeners() {
    // Mobile menu toggle
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    
    if (mobileBtn && sidebar) {
        mobileBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            // Basic mobile sidebar toggle style adjustment
            if (sidebar.classList.contains('open')) {
                sidebar.style.transform = 'translateY(0)';
            } else {
                sidebar.style.transform = '';
            }
        });
    }

    // Topbar Add Expense Button
    const topAddBtn = document.getElementById('add-expense-btn-top');
    if (topAddBtn) {
        topAddBtn.addEventListener('click', () => showExpenseModal());
    }

    // Re-render current view on chart theme change
    window.addEventListener('re-render-charts', () => {
        const viewContainer = document.querySelector('.view-section.active');
        if (viewContainer) {
            router.routes[router.currentRoute].renderFunction(viewContainer);
        }
    });
}
