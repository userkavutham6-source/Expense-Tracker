/**
 * Export data to CSV/JSON
 */
import { store } from './store.js';

export const exportData = (format = 'json') => {
    const data = store.state.expenses;
    if (data.length === 0) {
        alert("No data to export.");
        return;
    }

    let content, mimeType, extension;

    if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        extension = 'json';
    } else if (format === 'csv') {
        const headers = ['Date', 'Category', 'Description', 'Amount'];
        const rows = data.map(exp => [
            exp.date,
            exp.category,
            `"${exp.description.replace(/"/g, '""')}"`, // escape quotes
            exp.amount
        ]);
        
        content = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');
        
        mimeType = 'text/csv';
        extension = 'csv';
    }

    // Create download link
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `smarttrack-export-${new Date().toISOString().split('T')[0]}.${extension}`);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
