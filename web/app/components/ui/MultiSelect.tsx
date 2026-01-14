'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, LucideIcon, Layers } from 'lucide-react';

interface MultiSelectProps {
    options: { id: string, name: string }[];
    selected: string[];
    onToggle: (id: string) => void;
    label: string;
    icon?: LucideIcon;
}

export function MultiSelect({ options, selected, onToggle, label, icon: Icon = Layers }: MultiSelectProps) {
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
        <div className="relative group" ref={dropdownRef}>
            <button
                type="button"
                className="glass-dropdown focus-ring w-full sm:w-auto shadow-sm"
                style={{
                    color: 'var(--fg-primary)',
                }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    <Icon size={18} className="text-[var(--fg-muted)] sm:hidden opacity-50 group-hover:opacity-80 transition-opacity" />
                    <span className="hidden sm:inline">{selected.length === 0 ? label : 'Kategorie'}</span>
                </div>
                <ChevronDown size={14} className={`hidden sm:block transition-all duration-300 opacity-50 group-hover:opacity-80 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div
                    className="glass-popover absolute top-[calc(100%+8px)] left-0 z-100 min-w-[220px] overflow-hidden p-1.5"
                >
                    <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
                        {options.map(option => {
                            const isSelected = selected.includes(option.id);
                            return (
                                <div
                                    key={option.id}
                                    className={`group/item flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-[13px] transition-all hover:bg-white/[0.05] ${isSelected ? 'text-[var(--subject-primary)] bg-[var(--subject-primary)]/5' : 'text-text-secondary hover:text-text-primary'
                                        }`}
                                    onClick={() => onToggle(option.id)}
                                >
                                    <span className="truncate font-medium">{option.name}</span>
                                    <div className={`flex h-4 w-4 items-center justify-center rounded-md border transition-all ${isSelected
                                        ? 'border-[var(--subject-primary)] bg-[var(--subject-primary)] text-white shadow-[0_0_10px_rgba(var(--subject-primary),0.3)]'
                                        : 'border-white/10 bg-white/5 group-hover/item:border-white/20'
                                        }`}>
                                        {isSelected && <Check size={10} strokeWidth={4} />}
                                    </div>
                                </div>
                            );
                        })}
                        {options.length === 0 && (
                            <div className="px-3 py-4 text-center text-[12px] text-text-secondary italic">
                                Žádné kategorie
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
