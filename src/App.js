import React, { useState, useEffect } from 'react';
import './App.css';
import ClipboardList from './components/ClipboardList';
import SearchBar from './components/SearchBar';
import Settings from './components/Settings';
import LicenseManager from './components/LicenseManager';

function App() {
    const [clipboardHistory, setClipboardHistory] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [showLicense, setShowLicense] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [isPro, setIsPro] = useState(false);

    useEffect(() => {
        // Load initial clipboard history and dark mode preference
        loadClipboardHistory();
        loadDarkMode();
        loadLicenseStatus();

        // Listen for clipboard updates
        if (window.electronAPI) {
            window.electronAPI.onClipboardUpdate((history) => {
                setClipboardHistory(history);
                filterHistory(history, searchQuery);
            });
        }
    }, []);

    useEffect(() => {
        filterHistory(clipboardHistory, searchQuery);
    }, [searchQuery, clipboardHistory]);

    const loadClipboardHistory = async () => {
        if (window.electronAPI) {
            const history = await window.electronAPI.getClipboardHistory();
            setClipboardHistory(history);
            setFilteredHistory(history);
        }
    };

    const loadDarkMode = () => {
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        setDarkMode(savedDarkMode);
        if (savedDarkMode) {
            document.body.classList.add('dark-mode');
        }
    };

    const loadLicenseStatus = async () => {
        if (window.electronAPI) {
            const status = await window.electronAPI.getLicenseStatus();
            setIsPro(status.isPro);
        }
    };

    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem('darkMode', newDarkMode);
        if (newDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    };

    const filterHistory = (history, query) => {
        if (!query.trim()) {
            setFilteredHistory(history);
            return;
        }

        const filtered = history.filter(item =>
            item.content.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredHistory(filtered);
    };

    const handleCopy = async (content) => {
        if (window.electronAPI) {
            await window.electronAPI.copyToClipboard(content);
        }
    };

    const handleDelete = async (id) => {
        if (window.electronAPI) {
            const updatedHistory = await window.electronAPI.deleteItem(id);
            setClipboardHistory(updatedHistory);
        }
    };

    const handleTogglePin = async (id) => {
        if (window.electronAPI) {
            const updatedHistory = await window.electronAPI.togglePin(id);
            setClipboardHistory(updatedHistory);
        }
    };

    const handleClearAll = async () => {
        if (window.confirm('Clear all clipboard history? Pinned items will be kept.')) {
            if (window.electronAPI) {
                await window.electronAPI.clearHistory();
                setClipboardHistory([]);
            }
        }
    };

    const handleLicenseClose = () => {
        setShowLicense(false);
        loadLicenseStatus(); // Reload license status when closing
    };

    // Calculate free version limit warning
    const freeLimit = 20;
    const showLimitWarning = !isPro && clipboardHistory.length >= freeLimit;

    return (
        <div className="App">
            <header className="App-header">
                <h1>📋 Minimalistic Clipboard {isPro && <span className="pro-badge-small">PRO</span>}</h1>
                <div className="header-actions">
                    {!isPro && (
                        <button onClick={() => setShowLicense(true)} className="upgrade-btn">
                            ✨ Upgrade to Pro
                        </button>
                    )}
                    <button onClick={toggleDarkMode} className="theme-btn" title="Toggle dark mode">
                        {darkMode ? '☀️' : '🌙'}
                    </button>
                    {isPro && (
                        <button onClick={() => setShowLicense(true)} className="license-btn" title="Manage License">
                            🔑
                        </button>
                    )}
                    <button onClick={() => setShowSettings(!showSettings)} className="settings-btn">
                        ⚙️ Settings
                    </button>
                    <button onClick={handleClearAll} className="clear-btn">
                        🗑️ Clear All
                    </button>
                </div>
            </header>

            {showLicense && <LicenseManager onClose={handleLicenseClose} />}

            {showSettings ? (
                <Settings onClose={() => setShowSettings(false)} />
            ) : (
                <main className="App-main">
                    {showLimitWarning && (
                        <div className="limit-warning">
                            <div className="warning-content">
                                <span className="warning-icon">⚠️</span>
                                <span className="warning-text">
                                    Free version limit reached ({clipboardHistory.length}/{freeLimit} items).
                                    <strong> Upgrade to Pro</strong> for unlimited history!
                                </span>
                                <button className="warning-upgrade-btn" onClick={() => setShowLicense(true)}>
                                    Upgrade Now
                                </button>
                            </div>
                        </div>
                    )}

                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search clipboard history..."
                    />

                    <div className="stats">
                        <span>{filteredHistory.length} items</span>
                        <span>• {filteredHistory.filter(i => i.pinned).length} pinned</span>
                        {!isPro && <span>• {freeLimit - clipboardHistory.length} slots left</span>}
                        {isPro && <span className="pro-indicator">• ✨ Unlimited</span>}
                    </div>

                    <ClipboardList
                        items={filteredHistory}
                        onCopy={handleCopy}
                        onDelete={handleDelete}
                        onTogglePin={handleTogglePin}
                    />
                </main>
            )}
        </div>
    );
}

export default App;
