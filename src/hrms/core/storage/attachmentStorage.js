
const DB_NAME = 'HRMS_ATTACHMENTS_DB';
const DB_VERSION = 1;
const STORE_NAME = 'attachments';

const memoryCache = new Map();

function openDB() {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
            resolve(null);
            return;
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'key' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            console.warn('IndexedDB unavailable, falling back to in-memory store:', request.error);
            resolve(null);
        };
    });
}

export function compressImageFile(file, maxDimension = 1600, quality = 0.85) {
    return new Promise((resolve) => {
        if (!file || !file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;

                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                const outputType = file.type === 'image/png' && file.size < 2 * 1024 * 1024 ? 'image/png' : 'image/jpeg';
                const compressedDataUrl = canvas.toDataURL(outputType, quality);
                resolve(compressedDataUrl);
            };
            img.onerror = () => resolve(e.target.result);
            img.src = e.target.result;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
}

export const attachmentStorage = {
    saveFile: async (key, file) => {
        if (!key || !file) return null;

        try {
            const previewDataUrl = await compressImageFile(file);

            const rawDataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(file);
            });

            memoryCache.set(String(key), {
                previewDataUrl,
                rawDataUrl: rawDataUrl || previewDataUrl,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
            });

            const db = await openDB();
            if (db) {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                store.put({
                    key: String(key),
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: file.type,
                    previewDataUrl,
                    rawDataUrl: rawDataUrl || previewDataUrl,
                    updatedAt: Date.now(),
                });
            }

            return {
                previewDataUrl,
                rawDataUrl: rawDataUrl || previewDataUrl,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
            };
        } catch (err) {
            console.error('attachmentStorage.saveFile error:', err);
            return null;
        }
    },

    saveDataUrl: async (key, dataUrl, meta = {}) => {
        if (!key || !dataUrl) return;

        memoryCache.set(String(key), {
            previewDataUrl: dataUrl,
            rawDataUrl: dataUrl,
            fileName: meta.fileName || 'receipt.png',
            fileSize: meta.fileSize || 0,
            fileType: meta.fileType || 'image/png',
        });

        try {
            const db = await openDB();
            if (db) {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                store.put({
                    key: String(key),
                    previewDataUrl: dataUrl,
                    rawDataUrl: dataUrl,
                    fileName: meta.fileName || 'receipt.png',
                    fileSize: meta.fileSize || 0,
                    fileType: meta.fileType || 'image/png',
                    updatedAt: Date.now(),
                });
            }
        } catch (err) {
            console.warn('attachmentStorage.saveDataUrl error:', err);
        }
    },

    getFile: async (key) => {
        if (!key) return null;

        if (memoryCache.has(String(key))) {
            return memoryCache.get(String(key));
        }

        try {
            const db = await openDB();
            if (!db) return null;

            return new Promise((resolve) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const req = store.get(String(key));

                req.onsuccess = () => {
                    if (req.result) {
                        memoryCache.set(String(key), req.result);
                        resolve(req.result);
                    } else {
                        resolve(null);
                    }
                };
                req.onerror = () => resolve(null);
            });
        } catch {
            return null;
        }
    },

    removeFile: async (key) => {
        if (!key) return;
        memoryCache.delete(String(key));

        try {
            const db = await openDB();
            if (!db) return;
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.delete(String(key));
        } catch (err) {
            console.warn('attachmentStorage.removeFile error:', err);
        }
    },

    clearAll: async () => {
        memoryCache.clear();
        try {
            const db = await openDB();
            if (!db) return;
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.clear();
        } catch (err) {
            console.warn('attachmentStorage.clearAll error:', err);
        }
    },
};
