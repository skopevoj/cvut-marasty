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
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                className="flex h-[44px] cursor-pointer items-center justify-between rounded-xl border px-3 sm:px-4 text-[14px] font-medium transition-all outline-none gap-2"
                style={{
                    color: 'var(--fg-primary)',
                    borderColor: 'color-mix(in srgb, var(--subject-primary) 20%, transparent)',
                    background: 'color-mix(in srgb, var(--subject-primary) 2%, rgba(255,255,255,0.03))',
                    backdropFilter: 'blur(10px)'
                }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    <Icon size={18} className="text-[var(--fg-muted)] sm:hidden" />
                    {/* {selected.length > 0 && (
                        <span className="flex h-5 items-center justify-center rounded-md bg-[var(--subject-primary)] px-1.5 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(var(--subject-primary),0.3)]">
                            {selected.length}
                        </span>
                    )} */}
                    <span className="hidden sm:inline">{selected.length === 0 ? label : 'Kategorie'}</span>
                </div>
                <ChevronDown size={14} className={`hidden sm:block transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div
                    className="absolute top-[calc(100%+8px)] left-0 z-100 min-w-[200px] overflow-hidden rounded-2xl border p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-md"
                    style={{
                        borderColor: 'color-mix(in srgb, var(--subject-primary) 30%, transparent)',
                        background: 'color-mix(in srgb, var(--bg-surface) 80%, transparent)',
                    }}
                >
                    <div className="max-h-[300px] overflow-y-auto">
                        {options.map(option => {
                            const isSelected = selected.includes(option.id);
                            return (
                                <div
                                    key={option.id}
                                    className={`group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-[13px] transition-all hover:bg-white/[0.05] ${isSelected ? 'text-[var(--subject-primary)] bg-[var(--subject-primary)]/5' : 'text-text-secondary hover:text-text-primary'
                                        }`}
                                    onClick={() => onToggle(option.id)}
                                >
                                    <span className="truncate">{option.name}</span>
                                    <div className={`flex h-4 w-4 items-center justify-center rounded border transition-all ${isSelected
                                        ? 'border-[var(--subject-primary)] bg-[var(--subject-primary)] text-white'
                                        : 'border-white/10 bg-white/5 group-hover:border-white/20'
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
