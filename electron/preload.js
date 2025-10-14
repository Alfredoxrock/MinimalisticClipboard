const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getClipboardHistory: () => ipcRenderer.invoke('get-clipboard-history'),
    copyToClipboard: (content) => ipcRenderer.invoke('copy-to-clipboard', content),
    deleteItem: (id) => ipcRenderer.invoke('delete-item', id),
    togglePin: (id) => ipcRenderer.invoke('toggle-pin', id),
    clearHistory: () => ipcRenderer.invoke('clear-history'),
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
    onClipboardUpdate: (callback) => {
        ipcRenderer.on('clipboard-update', (event, history) => callback(history));
    },

    // Pro version APIs
    getLicenseStatus: () => ipcRenderer.invoke('get-license-status'),
    activateLicense: (licenseKey) => ipcRenderer.invoke('activate-license', licenseKey),
    deactivateLicense: () => ipcRenderer.invoke('deactivate-license')
});

// Expose openExternal for safely opening external checkout links
contextBridge.exposeInMainWorld('externalAPI', {
    openExternal: (url) => shell.openExternal(url)
});
