'use client';

import { useState, useRef, useEffect } from 'react';

interface MultiSelectProps {
    options: string[];
    selected: string[];
    onToggle: (option: string) => void;
    label: string;
}

export function MultiSelect({ options, selected, onToggle, label }: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="multiselect-container" ref={dropdownRef}>
            <div className="nav-select selection-trigger" onClick={() => setIsOpen(!isOpen)}>
                {selected.length === 0 ? label : `${selected.length} vybráno`}
                <span className="chevron-icon">{isOpen ? '▲' : '▼'}</span>
            </div>

            {isOpen && (
                <div className="dropdown-menu">
                    {options.map(option => (
                        <div
                            key={option}
                            className={`dropdown-item ${selected.includes(option) ? 'selected' : ''}`}
                            onClick={() => onToggle(option)}
                        >
                            <input
                                type="checkbox"
                                checked={selected.includes(option)}
                                readOnly
                            />
                            {option}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
