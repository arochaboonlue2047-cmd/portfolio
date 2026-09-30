/**
 * Storage Manager for Arocha Boonlue Portfolio
 * Provides reactive LocalStorage + IndexedDB for data, files, fonts, and themes.
 */

const STORAGE_KEY = "bumbim_portfolio_data_v1";
const DB_NAME = "BumbimPortfolioDB";
const DB_VERSION = 1;
const STORE_FILES = "uploaded_files";

class StorageManager {
  constructor() {
    this.db = null;
    this.initDB();
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_FILES)) {
          db.createObjectStore(STORE_FILES, { keyPath: "id" });
        }
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };
      request.onerror = (e) => {
        console.warn("IndexedDB error:", e);
        resolve(null);
      };
    });
  }

  // Load portfolio structured data
  getData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Merge with defaults to ensure all fields exist
        return {
          ...DEFAULT_PORTFOLIO_DATA,
          ...parsed,
          profile: { ...DEFAULT_PORTFOLIO_DATA.profile, ...(parsed.profile || {}) },
          themeSettings: { ...DEFAULT_PORTFOLIO_DATA.themeSettings, ...(parsed.themeSettings || {}) }
        };
      }
    } catch (err) {
      console.error("Error reading localStorage:", err);
    }
    return JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO_DATA));
  }

  // Save portfolio structured data
  saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent("portfolio-data-changed", { detail: data }));
      return true;
    } catch (err) {
      console.error("Error saving localStorage:", err);
      return false;
    }
  }

  // Save a large file into IndexedDB
  async saveFile(fileObj) {
    if (!this.db) await this.initDB();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_FILES], "readwrite");
      const store = tx.objectStore(STORE_FILES);
      const req = store.put(fileObj);
      req.onsuccess = () => resolve(fileObj.id);
      req.onerror = () => reject(req.error);
    });
  }

  // Get a file from IndexedDB
  async getFile(id) {
    if (!this.db) await this.initDB();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_FILES], "readonly");
      const store = tx.objectStore(STORE_FILES);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // Get all files
  async getAllFiles() {
    if (!this.db) await this.initDB();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_FILES], "readonly");
      const store = tx.objectStore(STORE_FILES);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  // Delete a file
  async deleteFile(id) {
    if (!this.db) await this.initDB();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_FILES], "readwrite");
      const store = tx.objectStore(STORE_FILES);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  // Export full backup as JSON
  async exportBackup() {
    const data = this.getData();
    const files = await this.getAllFiles();
    const backup = {
      timestamp: new Date().toISOString(),
      version: 1,
      author: "นางสาวอโรชา บุญเหลือ",
      data,
      files
    };
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bumbim_portfolio_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Import backup JSON
  async importBackup(jsonString) {
    try {
      const backup = JSON.parse(jsonString);
      if (backup.data) {
        this.saveData(backup.data);
      }
      if (backup.files && Array.isArray(backup.files)) {
        for (const file of backup.files) {
          await this.saveFile(file);
        }
      }
      return true;
    } catch (e) {
      console.error("Failed to import backup:", e);
      return false;
    }
  }

  // Reset all data to defaults
  resetToDefault() {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }
}

const portfolioStorage = new StorageManager();
