/**
 * Settings View
 */
import { store } from '../modules/store.js';
import { exportData } from '../modules/export.js';
import { db } from '../modules/db.js';
import { addRecurringRule } from '../modules/recurring.js';
import { sanitizeHTML } from '../modules/validator.js';
import { showToast } from './expenses.js';
import { formatCurrency, getCategoryLabel } from '../modules/utils.js';

export const renderSettings = (container) => {
    container.innerHTML = `
        <div class="grid-cards">
            <!-- Data Management -->
            <div class="card">
                <h3 style="margin-bottom: var(--space-4);">Data Export</h3>
                <p style="color: var(--text-secondary); margin-bottom: var(--space-4); font-size: 0.875rem;">Download your expense data for use in other applications.</p>
                <div style="display: flex; gap: var(--space-3);">
                    <button class="btn btn-outline" id="export-csv-btn">Export as CSV</button>
                    <button class="btn btn-outline" id="export-json-btn">Export as JSON</button>
                </div>
                
                <hr style="border: 0; border-top: 1px solid var(--border-color); margin: var(--space-6) 0;">
                
                <h3 style="margin-bottom: var(--space-4);">Data Import</h3>
                <p style="color: var(--text-secondary); margin-bottom: var(--space-4); font-size: 0.875rem;">Import expenses from a CSV file. Format: Date,Category,Description,Amount</p>
                <input type="file" id="import-csv-input" accept=".csv" style="display: none;">
                <button class="btn btn-outline" id="import-csv-btn">Select CSV File</button>

                <hr style="border: 0; border-top: 1px solid var(--border-color); margin: var(--space-6) 0;">
                
                <h3 style="margin-bottom: var(--space-4); color: var(--danger);">Danger Zone</h3>
                <p style="color: var(--text-secondary); margin-bottom: var(--space-4); font-size: 0.875rem;">Permanently delete all data in the current profile.</p>
                <button class="btn btn-danger" id="clear-data-btn">Clear All Data</button>
            </div>

            <!-- Categories -->
            <div class="card">
                <h3 style="margin-bottom: var(--space-4);">Categories</h3>
                <div id="category-list" style="margin-bottom: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2); max-height: 250px; overflow-y: auto;">
                    ${store.state.categories.map(c => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-2); background: var(--bg-body); border-radius: var(--radius-md);">
                            <div style="display: flex; align-items: center; gap: var(--space-2);">
                                <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: ${c.color};"></span>
                                <span>${sanitizeHTML(c.name)}</span>
                            </div>
                            ${c.isDefault ? '<span class="text-muted text-sm">Default</span>' : `<button class="icon-btn text-danger delete-cat-btn" data-id="${c.id}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>`}
                        </div>
                    `).join('')}
                </div>
                
                <form id="add-category-form" style="display: flex; gap: var(--space-2); flex-wrap: wrap;">
                    <input type="text" id="new-cat-name" class="form-control" placeholder="Category Name" required style="flex: 1; min-width: 120px;">
                    <input type="color" id="new-cat-color" class="form-control" value="#6366f1" style="width: 50px; padding: 2px; cursor: pointer;">
                    <button type="submit" class="btn btn-primary">Add</button>
                </form>
            </div>

            <!-- Profiles -->
            <div class="card">
                <h3 style="margin-bottom: var(--space-4);">Profiles</h3>
                <div id="profile-list" style="margin-bottom: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2);">
                    ${store.state.profiles.map(p => `
                        <div style="display: flex; justify-content: space-between; padding: var(--space-2); background: var(--bg-body); border-radius: var(--radius-md);">
                            <span>${sanitizeHTML(p.name)} (${p.currency})</span>
                            ${p.id === store.state.activeProfileId ? '<span class="text-success text-sm">Active</span>' : ''}
                        </div>
                    `).join('')}
                </div>
                
                <form id="add-profile-form" style="display: flex; gap: var(--space-2); flex-wrap: wrap;">
                    <input type="text" id="new-profile-name" class="form-control" placeholder="Profile Name" required style="flex: 1; min-width: 120px;">
                    <select id="new-profile-currency" class="form-control" style="width: auto;">
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="INR">INR (₹)</option>
                        <option value="JPY">JPY (¥)</option>
                    </select>
                    <button type="submit" class="btn btn-primary">Add</button>
                </form>
            </div>

            <!-- Recurring Expenses -->
            <div class="card" style="grid-column: 1 / -1;">
                <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-4);">
                    <h3>Recurring Expenses</h3>
                    <button class="btn btn-outline btn-sm" id="add-recurring-btn">Add Rule</button>
                </div>
                
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>Category</th>
                                <th>Frequency</th>
                                <th>Next Due</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${store.state.recurring.length > 0 ? store.state.recurring.map(rule => `
                                <tr>
                                    <td>${sanitizeHTML(rule.description)}</td>
                                    <td>${rule.amount}</td>
                                    <td>${sanitizeHTML(getCategoryLabel(rule.category))}</td>
                                    <td style="text-transform: capitalize;">${rule.frequency}</td>
                                    <td>${rule.nextDue}</td>
                                    <td><span class="badge ${rule.isActive ? 'badge-outline text-success' : 'badge-outline text-muted'}">${rule.isActive ? 'Active' : 'Inactive'}</span></td>
                                    <td>
                                        <button class="icon-btn toggle-rule-btn" data-id="${rule.id}" title="Toggle Status">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                                        </button>
                                    </td>
                                </tr>
                            `).join('') : `<tr><td colspan="7" class="text-center text-muted">No recurring expenses set up.</td></tr>`}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Events
    document.getElementById('export-csv-btn')?.addEventListener('click', () => exportData('csv'));
    document.getElementById('export-json-btn')?.addEventListener('click', () => exportData('json'));
    
    // CSV Import Logic
    const importInput = document.getElementById('import-csv-input');
    document.getElementById('import-csv-btn')?.addEventListener('click', () => importInput?.click());
    
    importInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            const lines = text.split('\n');
            let importedCount = 0;

            for (let i = 1; i < lines.length; i++) { // Skip header
                const line = lines[i].trim();
                if (!line) continue;
                
                // Extremely basic CSV parser handling quotes
                const row = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
                if (row && row.length >= 4) {
                    const date = row[0].replace(/"/g, '');
                    const category = row[1].replace(/"/g, '');
                    const desc = row[2].replace(/"/g, '');
                    const amount = parseFloat(row[3].replace(/"/g, ''));
                    
                    if (!isNaN(amount) && date && desc) {
                        await store.addExpense({
                            date, category, description: desc, amount, isRecurring: false
                        });
                        importedCount++;
                    }
                }
            }
            showToast(`Imported ${importedCount} expenses`, "success");
            // Reset input
            importInput.value = '';
            renderSettings(container);
        };
        reader.readAsText(file);
    });
    
    document.getElementById('clear-data-btn')?.addEventListener('click', async () => {
        if (confirm("WARNING: This will permanently delete all expenses, budgets, and recurring rules for the current profile. Are you sure?")) {
            const pid = store.state.activeProfileId;
            // Manual cleanup
            const expenses = await db.getByIndex('expenses', 'profileId', pid);
            for(let e of expenses) await db.delete('expenses', e.id);
            
            const budgets = await db.getByIndex('budgets', 'profileId', pid);
            for(let b of budgets) await db.delete('budgets', b.id);
            
            await store.loadProfileData(pid);
            showToast("All profile data cleared", "success");
            renderSettings(container);
        }
    });

    document.getElementById('add-profile-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('new-profile-name').value.trim();
        const currency = document.getElementById('new-profile-currency').value;
        if (name) {
            await store.addProfile({ name, currency });
            showToast("Profile created", "success");
            renderSettings(container);
        }
    });

    // Add Category
    document.getElementById('add-category-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('new-cat-name').value.trim();
        const color = document.getElementById('new-cat-color').value;
        if (name) {
            // Create a safe id
            const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
            await store.addCategory({ id, name, color, isDefault: false });
            showToast("Category added", "success");
            renderSettings(container);
        }
    });

    // Delete Category
    document.querySelectorAll('.delete-cat-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            if (confirm("Delete this category? Existing expenses won't be deleted but will lose their color.")) {
                await store.deleteCategory(id);
                showToast("Category deleted", "success");
                renderSettings(container);
            }
        });
    });

    document.getElementById('add-recurring-btn')?.addEventListener('click', showRecurringModal);

    document.querySelectorAll('.toggle-rule-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const rule = store.state.recurring.find(r => r.id === id);
            if (rule) {
                rule.isActive = !rule.isActive;
                await db.put('recurring', rule);
                showToast(`Rule ${rule.isActive ? 'activated' : 'deactivated'}`, "success");
                renderSettings(container);
            }
        });
    });
};

const showRecurringModal = () => {
    const modalContainer = document.getElementById('modal-container');
    const modalContent = document.getElementById('modal-content');
    const today = new Date().toISOString().split('T')[0];

    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>Add Recurring Expense</h3>
            <button class="icon-btn" id="close-rec-modal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
        <div class="modal-body">
            <form id="recurring-form">
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <input type="text" id="rec-desc" class="form-control" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Amount</label>
                    <input type="number" id="rec-amount" class="form-control" step="0.01" min="0.01" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select id="rec-category" class="form-control" required>
                        ${store.state.categories.map(c => `<option value="${c.id}">${sanitizeHTML(c.name)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Frequency</label>
                    <select id="rec-freq" class="form-control" required>
                        <option value="monthly">Monthly</option>
                        <option value="weekly">Weekly</option>
                        <option value="yearly">Yearly</option>
                        <option value="daily">Daily</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Start Date (Next Due)</label>
                    <input type="date" id="rec-start" class="form-control" required value="${today}">
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button class="btn btn-outline" id="cancel-rec-modal">Cancel</button>
            <button class="btn btn-primary" id="save-rec-btn">Save Rule</button>
        </div>
    `;

    modalContainer.classList.remove('hidden');

    const closeModal = () => modalContainer.classList.add('hidden');
    document.getElementById('close-rec-modal').addEventListener('click', closeModal);
    document.getElementById('cancel-rec-modal').addEventListener('click', closeModal);

    document.getElementById('save-rec-btn').addEventListener('click', async () => {
        const desc = document.getElementById('rec-desc').value.trim();
        const amount = parseFloat(document.getElementById('rec-amount').value);
        
        if (!desc || isNaN(amount) || amount <= 0) {
            alert("Invalid input"); return;
        }

        const rule = {
            description: desc,
            amount: amount,
            category: document.getElementById('rec-category').value,
            frequency: document.getElementById('rec-freq').value,
            startDate: document.getElementById('rec-start').value
        };

        try {
            await addRecurringRule(rule);
            closeModal();
            showToast("Recurring rule added", "success");
            renderSettings(document.querySelector('.view-section.active'));
        } catch (e) {
            console.error(e);
            alert("Error saving rule");
        }
    });
};
