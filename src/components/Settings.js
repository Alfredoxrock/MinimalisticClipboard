import React, { useState, useEffect } from 'react';
import './Settings.css';

function Settings({ onClose }) {
    const [settings, setSettings] = useState({
        maxHistorySize: 100,
        globalHotkey: 'CommandOrControl+Shift+V'
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        if (window.electronAPI) {
            const currentSettings = await window.electronAPI.getSettings();
            setSettings(currentSettings);
        }
    };

    const handleSave = async () => {
        if (window.electronAPI) {
            await window.electronAPI.saveSettings(settings);
            alert('Settings saved! Restart may be required for some changes.');
            onClose();
        }
    };

    return (
        <div className="settings-panel">
            <div className="settings-header">
                <h2>⚙️ Settings</h2>
                <button onClick={onClose} className="close-btn">✕</button>
            </div>

            <div className="settings-content">
                <div className="setting-group">
                    <label>Maximum History Size</label>
                    <input
                        type="number"
                        value={settings.maxHistorySize}
                        onChange={(e) => setSettings({ ...settings, maxHistorySize: parseInt(e.target.value) })}
                        min="10"
                        max="1000"
                    />
                    <small>Number of clipboard items to keep in history</small>
                </div>

                <div className="setting-group">
                    <label>Global Hotkey</label>
                    <input
                        type="text"
                        value={settings.globalHotkey}
                        onChange={(e) => setSettings({ ...settings, globalHotkey: e.target.value })}
                        placeholder="e.g., CommandOrControl+Shift+V"
                    />
                    <small>Keyboard shortcut to open/close the app (requires restart)</small>
                </div>

                <div className="settings-actions">
                    <button onClick={handleSave} className="save-btn">💾 Save Settings</button>
                    <button onClick={onClose} className="cancel-btn">Cancel</button>
                </div>
            </div>
        </div>
    );
}

export default Settings;
