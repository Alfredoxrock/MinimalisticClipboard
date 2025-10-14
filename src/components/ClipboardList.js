import React from 'react';
import './ClipboardList.css';

function ClipboardList({ items, onCopy, onDelete, onTogglePin }) {
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;

        return date.toLocaleDateString();
    };

    const truncateContent = (content, maxLength = 200) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    };

    // Sort: pinned items first
    const sortedItems = [...items].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return 0;
    });

    return (
        <div className="clipboard-list">
            {sortedItems.length === 0 ? (
                <div className="empty-state">
                    <p>📋</p>
                    <h3>No clipboard items yet</h3>
                    <p>Copy something to get started!</p>
                </div>
            ) : (
                sortedItems.map((item) => (
                    <div key={item.id} className={`clipboard-item ${item.pinned ? 'pinned' : ''}`}>
                        <div className="item-header">
                            <span className="item-time">{formatTimestamp(item.timestamp)}</span>
                            {item.pinned && <span className="pin-badge">📌 Pinned</span>}
                        </div>
                        <div className="item-content">
                            {truncateContent(item.content)}
                        </div>
                        <div className="item-actions">
                            <button
                                onClick={() => onCopy(item.content)}
                                className="action-btn copy-btn"
                                title="Copy to clipboard"
                            >
                                📋 Copy
                            </button>
                            <button
                                onClick={() => onTogglePin(item.id)}
                                className="action-btn pin-btn"
                                title={item.pinned ? 'Unpin' : 'Pin'}
                            >
                                {item.pinned ? '📌 Unpin' : '📍 Pin'}
                            </button>
                            <button
                                onClick={() => onDelete(item.id)}
                                className="action-btn delete-btn"
                                title="Delete"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

export default ClipboardList;
