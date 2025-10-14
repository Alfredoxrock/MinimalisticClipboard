import React, { useState, useEffect } from 'react';
import './LicenseManager.css';

function LicenseManager({ onClose }) {
    const [licenseStatus, setLicenseStatus] = useState(null);
    const [licenseKey, setLicenseKey] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadLicenseStatus();
    }, []);

    const loadLicenseStatus = async () => {
        if (window.electronAPI) {
            const status = await window.electronAPI.getLicenseStatus();
            setLicenseStatus(status);
        }
    };

    const handleActivate = async () => {
        if (!licenseKey.trim()) {
            setMessage('Please enter a license key.');
            return;
        }

        setIsLoading(true);
        setMessage('');

        if (window.electronAPI) {
            const result = await window.electronAPI.activateLicense(licenseKey);
            setMessage(result.message);

            if (result.success) {
                await loadLicenseStatus();
                setLicenseKey('');
                setTimeout(() => {
                    onClose();
                }, 2000);
            }
        }

        setIsLoading(false);
    };

    const handleDeactivate = async () => {
        if (window.confirm('Are you sure you want to deactivate your Pro license?')) {
            if (window.electronAPI) {
                await window.electronAPI.deactivateLicense();
                await loadLicenseStatus();
                setMessage('License deactivated successfully.');
            }
        }
    };

    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleDateString();
    };

    return (
        <div className="license-overlay">
            <div className="license-panel">
                <div className="license-header">
                    <h2>License Management</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="license-content">
                    {licenseStatus?.isPro ? (
                        <div className="pro-status">
                            <div className="pro-badge">✨ PRO VERSION ACTIVE</div>
                            <div className="license-details">
                                <div className="detail-row">
                                    <span className="detail-label">License Key:</span>
                                    <span className="detail-value">{licenseStatus.licenseKey}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Activated:</span>
                                    <span className="detail-value">{formatDate(licenseStatus.activatedDate)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Status:</span>
                                    <span className="detail-value status-active">✓ Unlimited Items</span>
                                </div>
                            </div>
                            <button className="deactivate-btn" onClick={handleDeactivate}>
                                Deactivate License
                            </button>
                        </div>
                    ) : (
                        <div className="free-status">
                            <div className="free-badge">FREE VERSION</div>
                            <div className="feature-comparison">
                                <div className="feature-box free-features">
                                    <h3>Free</h3>
                                    <ul>
                                        <li>✓ Up to 20 clipboard items</li>
                                        <li>✓ Search & filter</li>
                                        <li>✓ Pin important items</li>
                                        <li>✓ Global hotkey</li>
                                        <li>✓ System tray</li>
                                    </ul>
                                </div>
                                <div className="feature-box pro-features">
                                    <h3>Pro ✨</h3>
                                    <ul>
                                        <li>✨ Unlimited clipboard items</li>
                                        <li>✨ Priority support</li>
                                        <li>✨ Future premium features</li>
                                        <li>✨ Support development</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="activation-section">
                                <h3>Activate Pro License</h3>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        value={licenseKey}
                                        onChange={(e) => setLicenseKey(e.target.value)}
                                        placeholder="Enter license key (e.g., PRO-XXXX-XXXX-XXXX)"
                                        className="license-input"
                                        disabled={isLoading}
                                    />
                                    <button
                                        className="activate-btn"
                                        onClick={handleActivate}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Activating...' : 'Activate'}
                                    </button>
                                </div>
                                {message && (
                                    <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
                                        {message}
                                    </div>
                                )}

                                <div className="purchase-info">
                                    <p>Don't have a license key?</p>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <button
                                            className="buy-link"
                                            onClick={() => {
                                                const demoUrl = 'http://localhost:4242/checkout-demo?email=test%40example.com';
                                                try {
                                                    if (typeof window?.externalAPI?.openExternal === 'function') {
                                                        window.externalAPI.openExternal(demoUrl);
                                                        return;
                                                    }
                                                } catch (e) {
                                                    // ignore and fallback to window.open
                                                }

                                                // Fallback for browser/dev: open in new tab
                                                window.open(demoUrl, '_blank');
                                            }}
                                        >
                                            Purchase Pro Version →
                                        </button>
                                        <small style={{ color: '#666' }}>Opens hosted checkout (demo)</small>
                                    </div>
                                    <p className="demo-keys">
                                        <small>Demo keys for testing:</small><br />
                                        <code>PRO-MC-2024-PREMIUM</code>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default LicenseManager;
