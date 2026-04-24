/**
 * Chart.js Wrappers
 */
import { getThemeColors } from './theme.js';
import { getCategoryColor, getCategoryLabel } from './utils.js';

// Store active chart instances to destroy them before re-rendering
const activeCharts = {};

const createChart = (canvasId, config) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    // Destroy existing chart if it exists
    if (activeCharts[canvasId]) {
        activeCharts[canvasId].destroy();
    }

    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, config);
    activeCharts[canvasId] = chart;
    
    return chart;
};

// Global default settings for charts
const applyGlobalChartSettings = () => {
    if (typeof Chart === 'undefined') return;
    
    const theme = getThemeColors();
    
    Chart.defaults.color = theme.textSecondary;
    Chart.defaults.font.family = "'Inter', sans-serif";
    
    if (Chart.defaults.plugins.tooltip) {
        Chart.defaults.plugins.tooltip.backgroundColor = theme.theme === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)';
        Chart.defaults.plugins.tooltip.titleColor = theme.textPrimary;
        Chart.defaults.plugins.tooltip.bodyColor = theme.textSecondary;
        Chart.defaults.plugins.tooltip.borderColor = theme.borderColor;
        Chart.defaults.plugins.tooltip.borderWidth = 1;
        Chart.defaults.plugins.tooltip.padding = 10;
        Chart.defaults.plugins.tooltip.displayColors = true;
    }
};

export const renderCategoryDoughnut = (canvasId, data) => {
    applyGlobalChartSettings();
    
    const categories = Object.keys(data);
    const amounts = Object.values(data);
    
    if (categories.length === 0) {
        // Render empty state chart
        const theme = getThemeColors();
        return createChart(canvasId, {
            type: 'doughnut',
            data: {
                labels: ['No Data'],
                datasets: [{
                    data: [1],
                    backgroundColor: [theme.borderColor],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
    }

    const colors = categories.map(cat => getCategoryColor(cat));
    const labels = categories.map(cat => getCategoryLabel(cat));

    return createChart(canvasId, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: amounts,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                }
            }
        }
    });
};

export const renderTrendLineChart = (canvasId, labels, dataPoints) => {
    applyGlobalChartSettings();
    const theme = getThemeColors();

    // Create gradient
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.5)'); // primary transparent
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

    return createChart(canvasId, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Spending',
                data: dataPoints,
                borderColor: '#6366f1', // primary
                backgroundColor: gradient,
                borderWidth: 2,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: theme.theme === 'dark' ? '#1e293b' : '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4 // smooth curves
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false, drawBorder: false }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: theme.gridColor,
                        drawBorder: false
                    },
                    ticks: {
                        callback: function(value) {
                            return '₹' + value; // Assuming INR for now or just generic currency symbol
                        }
                    }
                }
            }
        }
    });
};

export const renderBarChart = (canvasId, labels, dataPoints, colors = null) => {
    applyGlobalChartSettings();
    const theme = getThemeColors();

    return createChart(canvasId, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Amount',
                data: dataPoints,
                backgroundColor: colors || '#6366f1',
                borderRadius: 4,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false, drawBorder: false }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: theme.gridColor,
                        drawBorder: false
                    }
                }
            }
        }
    });
};

// Re-render charts on theme change
window.addEventListener('themeChanged', () => {
    // We would need to trigger a re-render of the current view here,
    // which should ideally be handled by the router or components themselves.
    // For now, we'll dispatch a custom event that views can listen to.
    window.dispatchEvent(new CustomEvent('re-render-charts'));
});
