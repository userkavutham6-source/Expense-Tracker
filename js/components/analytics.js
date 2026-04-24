/**
 * Analytics View
 */
import { store } from '../modules/store.js';
import { renderTrendLineChart, renderBarChart } from '../modules/charts.js';
import { getCategoryLabel, getCategoryColor } from '../modules/utils.js';

export const renderAnalytics = (container) => {
    const expenses = store.state.expenses;

    if (expenses.length === 0) {
        container.innerHTML = `
            <div class="text-center card" style="padding: var(--space-8); color: var(--text-muted);">
                <h3>No Data Available</h3>
                <p>Add some expenses to see your analytics.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="grid-cards">
            <div class="card" style="grid-column: 1 / -1;">
                <h3 style="margin-bottom: var(--space-4);">Spending Trend (Last 6 Months)</h3>
                <div style="position: relative; height: 300px; width: 100%;">
                    <canvas id="trend-chart"></canvas>
                </div>
            </div>
            
            <div class="card">
                <h3 style="margin-bottom: var(--space-4);">Top Categories (All Time)</h3>
                <div style="position: relative; height: 300px; width: 100%;">
                    <canvas id="category-bar-chart"></canvas>
                </div>
            </div>
            
            <div class="card">
                <h3 style="margin-bottom: var(--space-4);">Monthly Breakdown</h3>
                <div id="monthly-stats-list" style="display: flex; flex-direction: column; gap: var(--space-3);">
                    <!-- Populated dynamically -->
                </div>
            </div>
        </div>
    `;

    // Process data for trend chart (Last 6 months)
    const today = new Date();
    const months = [];
    const trendData = [];
    
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push(d.toLocaleString('default', { month: 'short' }));
        
        const start = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const end = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
        
        const total = store.getTotalExpenses(start, end);
        trendData.push(total);
    }

    // Process data for category bar chart
    const catTotals = store.getExpensesByCategory();
    // Sort categories by amount
    const sortedCats = Object.entries(catTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Top 5
        
    const barLabels = sortedCats.map(c => getCategoryLabel(c[0]));
    const barData = sortedCats.map(c => c[1]);
    const barColors = sortedCats.map(c => getCategoryColor(c[0]));

    // Populate monthly list
    const listContainer = document.getElementById('monthly-stats-list');
    let listHTML = '';
    const currency = store.getActiveProfileDetails().currency;
    
    months.slice().reverse().forEach((month, idx) => {
        const amount = trendData[5 - idx];
        const percentage = Math.max(trendData) > 0 ? (amount / Math.max(...trendData)) * 100 : 0;
        
        listHTML += `
            <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 4px;">
                    <span>${month}</span>
                    <span class="font-medium">${new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)}</span>
                </div>
                <div class="progress-wrapper">
                    <div class="progress-fill" style="width: ${percentage}%; background-color: var(--primary);"></div>
                </div>
            </div>
        `;
    });
    
    if (listContainer) listContainer.innerHTML = listHTML;

    // Render charts
    setTimeout(() => {
        renderTrendLineChart('trend-chart', months, trendData);
        renderBarChart('category-bar-chart', barLabels, barData, barColors);
    }, 0);
};
