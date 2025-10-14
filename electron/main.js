const { app, BrowserWindow, ipcMain, clipboard, globalShortcut, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();
let mainWindow = null;
let tray = null;
let clipboardHistory = [];
let clipboardWatcher = null;
const http = require('http');
const https = require('https');

// Initialize clipboard history from store
function initClipboardHistory() {
    clipboardHistory = store.get('clipboardHistory', []);
    console.log('Loaded clipboard history:', clipboardHistory.length, 'items');
}

// Start watching clipboard
function startClipboardWatcher() {
    let previousText = clipboard.readText();

    clipboardWatcher = setInterval(() => {
        const currentText = clipboard.readText();

        if (currentText && currentText !== previousText && currentText.trim() !== '') {
            previousText = currentText;

            // Add to history (avoid duplicates at the top)
            const existingIndex = clipboardHistory.findIndex(item => item.content === currentText);
            if (existingIndex > -1) {
                clipboardHistory.splice(existingIndex, 1);
            }

            const newItem = {
                id: Date.now(),
                content: currentText,
                type: 'text',
                timestamp: new Date().toISOString(),
                pinned: false
            };

            clipboardHistory.unshift(newItem);

            // Limit history size based on pro status
            const isPro = store.get('isPro', false);
            const maxItems = isPro ? store.get('maxHistorySize', 100) : 20;

            // Keep pinned items even if over limit
            const pinnedItems = clipboardHistory.filter(item => item.pinned);
            const unpinnedItems = clipboardHistory.filter(item => !item.pinned);

            if (unpinnedItems.length > maxItems) {
                clipboardHistory = [...pinnedItems, ...unpinnedItems.slice(0, maxItems)];
            }

            // Save to store
            store.set('clipboardHistory', clipboardHistory);

            // Notify renderer
            if (mainWindow) {
                mainWindow.webContents.send('clipboard-update', clipboardHistory);
            }

            console.log('New clipboard item:', currentText.substring(0, 50));
        }
    }, 500); // Check every 500ms
}

function stopClipboardWatcher() {
    if (clipboardWatcher) {
        clearInterval(clipboardWatcher);
        clipboardWatcher = null;
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        minWidth: 600,
        minHeight: 400,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        show: false,
        frame: true,
        title: 'Minimalistic Clipboard'
    });    // Load React app
    const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../build/index.html')}`;
    mainWindow.loadURL(startUrl);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Open DevTools in development
    if (process.env.ELECTRON_START_URL) {
        mainWindow.webContents.openDevTools();
    }
}

function createTray() {
    // Create a simple tray icon (you should replace with actual icon)
    const icon = nativeImage.createEmpty();
    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Open Minimalistic Clipboard', click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                } else {
                    createWindow();
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Quit', click: () => {
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Minimalistic Clipboard');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        } else {
            createWindow();
        }
    });
}

// IPC Handlers
ipcMain.handle('get-clipboard-history', () => {
    return clipboardHistory;
});

ipcMain.handle('copy-to-clipboard', (event, content) => {
    clipboard.writeText(content);
    return true;
});

ipcMain.handle('delete-item', (event, id) => {
    clipboardHistory = clipboardHistory.filter(item => item.id !== id);
    store.set('clipboardHistory', clipboardHistory);
    return clipboardHistory;
});

ipcMain.handle('toggle-pin', (event, id) => {
    const item = clipboardHistory.find(item => item.id === id);
    if (item) {
        item.pinned = !item.pinned;
        store.set('clipboardHistory', clipboardHistory);
    }
    return clipboardHistory;
});

ipcMain.handle('clear-history', () => {
    clipboardHistory = [];
    store.set('clipboardHistory', []);
    return true;
});

ipcMain.handle('get-settings', () => {
    return {
        maxHistorySize: store.get('maxHistorySize', 100),
        globalHotkey: store.get('globalHotkey', 'CommandOrControl+Shift+V')
    };
});

ipcMain.handle('save-settings', (event, settings) => {
    store.set('maxHistorySize', settings.maxHistorySize);
    store.set('globalHotkey', settings.globalHotkey);

    // Re-register global shortcut
    registerGlobalShortcut();

    return true;
});

// Pro version handlers
ipcMain.handle('get-license-status', () => {
    return {
        isPro: store.get('isPro', false),
        licenseKey: store.get('licenseKey', ''),
        activatedDate: store.get('activatedDate', null)
    };
});

ipcMain.handle('activate-license', (event, licenseKey) => {
    // Simple license validation (in production, you'd validate against a server)
    const validLicenses = [
        'PRO-MC-2024-PREMIUM',
        'PRO-MC-LIFETIME-KEY',
        'MC-UNLIMITED-2024'
    ];

    // Check if it matches pattern: PRO-xxxx-xxxx-xxxx
    const isValidFormat = /^PRO-[A-Z0-9]{2,8}-[A-Z0-9]{2,8}-[A-Z0-9]{2,8}$/i.test(licenseKey);
    const isValidKey = validLicenses.includes(licenseKey.toUpperCase()) || isValidFormat;

    if (isValidKey) {
        store.set('isPro', true);
        store.set('licenseKey', licenseKey.toUpperCase());
        store.set('activatedDate', new Date().toISOString());
        return { success: true, message: 'License activated successfully!' };
    } else {
        return { success: false, message: 'Invalid license key. Please check and try again.' };
    }
});

ipcMain.handle('deactivate-license', () => {
    store.set('isPro', false);
    store.set('licenseKey', '');
    store.set('activatedDate', null);
    return true;
});

function registerGlobalShortcut() {
    globalShortcut.unregisterAll();

    const hotkey = store.get('globalHotkey', 'CommandOrControl+Shift+V');

    const registered = globalShortcut.register(hotkey, () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        } else {
            createWindow();
        }
    });

    if (registered) {
        console.log('Global shortcut registered:', hotkey);
    } else {
        console.error('Global shortcut registration failed');
    }
}

// Handle deep links: minimalistic-clipboard://activate?key=...
const gotTheLock = app.requestSingleInstanceLock();
let deeplinkUrl = null;

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, argv) => {
        // Windows: URL will be in argv array when launched via protocol
        const url = argv.find(a => a && a.startsWith('minimalistic-clipboard://'));
        if (url) {
            deeplinkUrl = url;
            handleDeepLink(url);
        }

        if (mainWindow) {
            if (!mainWindow.isVisible()) mainWindow.show();
            mainWindow.focus();
        }
    });

    // macOS open-url event
    app.on('open-url', (event, url) => {
        event.preventDefault();
        deeplinkUrl = url;
        handleDeepLink(url);
    });

    app.whenReady().then(() => {
        // Register protocol handler (Windows/macOS/Linux behavior differs)
        if (process.defaultApp) {
            if (process.argv.length >= 2) {
                app.setAsDefaultProtocolClient('minimalistic-clipboard', process.execPath, [path.resolve(process.argv[1])]);
            }
        } else {
            app.setAsDefaultProtocolClient('minimalistic-clipboard');
        }

        initClipboardHistory();
        createWindow();
        createTray();
        startClipboardWatcher();
        registerGlobalShortcut();

        // If the app was launched with a deep link URL (Windows)
        if (!deeplinkUrl) {
            const urlArg = process.argv.find(a => a && a.startsWith('minimalistic-clipboard://'));
            if (urlArg) {
                deeplinkUrl = urlArg;
                handleDeepLink(urlArg);
            }
        } else {
            handleDeepLink(deeplinkUrl);
        }
        // Check license status with server on startup
        checkLicenseWithServer();
        // Schedule daily check (24h)
        setInterval(checkLicenseWithServer, 24 * 60 * 60 * 1000);
    });

    app.on('window-all-closed', () => {
        // Keep app running in tray
        // Don't quit on macOS unless explicitly quit
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    app.on('will-quit', () => {
        stopClipboardWatcher();
        globalShortcut.unregisterAll();
    });
}

function handleDeepLink(url) {
    try {
        const parsed = new URL(url);
        if (parsed.hostname === 'activate') {
            const key = parsed.searchParams.get('key');
            if (key) {
                // Activate license using existing handler
                const result = ipcMain.emit('activate-license', null, key);
                // Also call activation logic directly to persist
                const isValidFormat = /^PRO-[A-Z0-9]{2,8}-[A-Z0-9]{2,8}-[A-Z0-9]{2,8}$/i.test(key);
                const validLicenses = [
                    'PRO-MC-2024-PREMIUM',
                    'PRO-MC-LIFETIME-KEY',
                    'MC-UNLIMITED-2024'
                ];
                const isValidKey = validLicenses.includes(key.toUpperCase()) || isValidFormat;
                if (isValidKey) {
                    store.set('isPro', true);
                    store.set('licenseKey', key.toUpperCase());
                    store.set('activatedDate', new Date().toISOString());
                    if (mainWindow) mainWindow.webContents.send('license-updated', { isPro: true, licenseKey: key.toUpperCase() });
                }
            }
        }
    } catch (e) {
        console.error('Failed to parse deep link URL', e);
    }
}

// Periodic license validation with server
async function checkLicenseWithServer() {
    const key = store.get('licenseKey', '');
    if (!key) return;
    try {
        const serverUrl = process.env.LICENSE_SERVER_URL || 'http://localhost:4242';
        const url = `${serverUrl}/license/${encodeURIComponent(key)}`;
        const lib = url.startsWith('https') ? https : http;
        lib.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.revoked) {
                        console.log('License revoked on server. Disabling Pro.');
                        store.set('isPro', false);
                        store.set('licenseKey', '');
                        store.set('activatedDate', null);
                        if (mainWindow) mainWindow.webContents.send('license-updated', { isPro: false });
                    } else {
                        // license is fine
                    }
                } catch (e) {
                    console.error('Failed to parse license validation response', e);
                }
            });
        }).on('error', (err) => {
            console.error('License validation request failed', err);
        });
    } catch (e) {
        console.error('Error checking license with server', e);
    }
}
