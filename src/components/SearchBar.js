import React from 'react';
import './SearchBar.css';

function SearchBar({ value, onChange, placeholder }) {
    return (
        <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="search-input"
            />
            {value && (
                <button
                    onClick={() => onChange('')}
                    className="clear-search"
                    title="Clear search"
                >
                    ✕
                </button>
            )}
        </div>
    );
}

export default SearchBar;
