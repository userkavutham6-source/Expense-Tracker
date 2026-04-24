/**
 * IndexedDB Wrapper for persistent storage
 */
import { generateId } from './utils.js';

const DB_NAME = 'SmartExpenseTrackerDB';
const DB_VERSION = 2;

class Database {
    constructor() {
        this.db = null;
        this.initPromise = this.init();
    }

    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("IndexedDB error:", event.target.error);
                reject("Could not open database");
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores
                if (!db.objectStoreNames.contains('profiles')) {
                    db.createObjectStore('profiles', { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains('expenses')) {
                    const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' });
                    expenseStore.createIndex('profileId', 'profileId', { unique: false });
                    expenseStore.createIndex('date', 'date', { unique: false });
                    expenseStore.createIndex('category', 'category', { unique: false });
                }

                if (!db.objectStoreNames.contains('budgets')) {
                    const budgetStore = db.createObjectStore('budgets', { keyPath: 'id' });
                    budgetStore.createIndex('profileId', 'profileId', { unique: false });
                    budgetStore.createIndex('category', 'category', { unique: false });
                }

                if (!db.objectStoreNames.contains('recurring')) {
                    const recurringStore = db.createObjectStore('recurring', { keyPath: 'id' });
                    recurringStore.createIndex('profileId', 'profileId', { unique: false });
                }

                if (!db.objectStoreNames.contains('categories')) {
                    const catStore = db.createObjectStore('categories', { keyPath: 'id' });
                    catStore.createIndex('profileId', 'profileId', { unique: false });
                }

                if (!db.objectStoreNames.contains('receipts')) {
                    const receiptStore = db.createObjectStore('receipts', { keyPath: 'id' });
                    receiptStore.createIndex('expenseId', 'expenseId', { unique: true });
                }
            };
        });
    }

    async getStore(storeName, mode = 'readonly') {
        await this.initPromise;
        const transaction = this.db.transaction(storeName, mode);
        return transaction.objectStore(storeName);
    }

    async add(storeName, data) {
        const store = await this.getStore(storeName, 'readwrite');
        const item = { ...data, id: data.id || generateId(), createdAt: Date.now(), updatedAt: Date.now() };
        
        return new Promise((resolve, reject) => {
            const request = store.add(item);
            request.onsuccess = () => resolve(item);
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName, data) {
        const store = await this.getStore(storeName, 'readwrite');
        const item = { ...data, updatedAt: Date.now() };
        
        return new Promise((resolve, reject) => {
            const request = store.put(item);
            request.onsuccess = () => resolve(item);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        const store = await this.getStore(storeName, 'readwrite');
        
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, id) {
        const store = await this.getStore(storeName);
        
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        const store = await this.getStore(storeName);
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async getByIndex(storeName, indexName, value) {
        const store = await this.getStore(storeName);
        const index = store.index(indexName);
        
        return new Promise((resolve, reject) => {
            const request = index.getAll(value);
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }
    
    async clear(storeName) {
        const store = await this.getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }
}

export const db = new Database();
