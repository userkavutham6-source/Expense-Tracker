/**
 * Dashboard View
 */
import { store } from '../modules/store.js';
import { formatCurrency, getCategoryLabel, formatDate } from '../modules/utils.js';
import { renderCategoryDoughnut } from '../modules/charts.js';
import { getSpendingInsights } from '../modules/predictions.js';
import { sanitizeHTML } from '../modules/validator.js';

export const renderDashboard = (container) => {
    const state = store.state;
    const currency = store.getActiveProfileDetails().currency;

    // Calculate basic stats
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const totalToday = store.getTotalExpenses(today, today);
    const totalWeek = store.getTotalExpenses(startOfWeek, today);
    const totalMonth = store.getTotalExpenses(startOfMonth, today);
    const totalAll = store.getTotalExpenses();

    const categoryBreakdown = store.getExpensesByCategory(startOfMonth, today);
    const insights = getSpendingInsights();

    let insightsHTML = '';
    if (insights) {
        insightsHTML = `
            <div class="card stat-card">
                <span class="stat-title">Spending Insights</span>
                <span class="stat-value" style="font-size: 1.5rem;">${insights.isProjectedHigher ? 'Trending Up' : 'On Track'}</span>
                <span class="stat-trend ${insights.isProjectedHigher ? 'trend-up' : 'trend-down'}">
                    ${insights.isProjectedHigher ? 
                        `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>` : 
                        `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>`}
                    ${insights.percentageDiff}% vs last month
                </span>
                <div style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.5rem;">
                    Projected: ${formatCurrency(insights.projectedTotal, currency)}
                </div>
            </div>
        `;
    }

    // Budget warnings
    let warningsHTML = '';
    const monthExpensesByCategory = store.getExpensesByCategory(startOfMonth, today);
    
    state.budgets.forEach(budget => {
        const spent = budget.category === 'total' ? totalMonth : (monthExpensesByCategory[budget.category] || 0);
        const limit = budget.limit;
        const percentage = (spent / limit) * 100;
        
        if (percentage >= 90) {
            warningsHTML += `
                <div class="card" style="background-color: var(--danger-light); border-color: var(--danger); margin-bottom: var(--space-4);">
                    <div style="display: flex; align-items: center; gap: var(--space-3); color: var(--danger);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        <div>
                            <strong>Budget Warning:</strong> You have used ${percentage.toFixed(0)}% of your ${budget.category === 'total' ? 'overall' : sanitizeHTML(getCategoryLabel(budget.category))} budget.
                        </div>
                    </div>
                </div>
            `;
        }
    });

    const recentExpenses = state.expenses.slice(0, 5);
    let recentHTML = '';
    if (recentExpenses.length > 0) {
        recentHTML = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th class="text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recentExpenses.map(exp => `
                            <tr>
                                <td>${formatDate(exp.date)}</td>
                                <td>${sanitizeHTML(exp.description)}</td>
                                <td>
                                    <span class="badge" style="background-color: var(--cat-${exp.category}); color: white;">
                                        ${sanitizeHTML(getCategoryLabel(exp.category))}
                                    </span>
                                </td>
                                <td class="text-right font-medium">${formatCurrency(exp.amount, currency)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div style="margin-top: var(--space-4); text-align: center;">
                <a href="#/expenses" class="btn btn-outline" style="width: 100%;">View All Expenses</a>
            </div>
        `;
    } else {
        recentHTML = `
            <div class="text-center" style="padding: var(--space-6); color: var(--text-muted);">
                <p>No recent expenses.</p>
            </div>
        `;
    }

    container.innerHTML = `
        ${warningsHTML}
        
        <div class="grid-cards">
            <div class="card stat-card">
                <span class="stat-title">Total Spending (All Time)</span>
                <span class="stat-value">${formatCurrency(totalAll, currency)}</span>
            </div>
            <div class="card stat-card">
                <span class="stat-title">This Month</span>
                <span class="stat-value">${formatCurrency(totalMonth, currency)}</span>
            </div>
            <div class="card stat-card">
                <span class="stat-title">This Week</span>
                <span class="stat-value">${formatCurrency(totalWeek, currency)}</span>
            </div>
            ${insightsHTML || `
            <div class="card stat-card">
                <span class="stat-title">Today</span>
                <span class="stat-value">${formatCurrency(totalToday, currency)}</span>
            </div>
            `}
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-6); margin-top: var(--space-6);">
            <div class="card" style="display: flex; flex-direction: column;">
                <h3 style="margin-bottom: var(--space-4); font-size: 1.125rem;">This Month's Spending</h3>
                <div style="position: relative; height: 250px; width: 100%; flex: 1;">
                    <canvas id="dashboard-doughnut-chart"></canvas>
                </div>
            </div>
            
            <div class="card">
                <h3 style="margin-bottom: var(--space-4); font-size: 1.125rem;">Recent Expenses</h3>
                ${recentHTML}
            </div>
        </div>
    `;

    // Render chart after DOM update
    setTimeout(() => {
        renderCategoryDoughnut('dashboard-doughnut-chart', categoryBreakdown);
    }, 0);
};
