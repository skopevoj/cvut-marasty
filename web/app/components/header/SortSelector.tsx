'use client';

import { SortType } from "../../lib/context/QuizContext";
import { ChevronDown, ArrowUpDown } from "lucide-react";

interface SortSelectorProps {
    sortType: SortType;
    onSelectSort: (type: SortType) => void;
}

export function SortSelector({ sortType, onSelectSort }: SortSelectorProps) {
    const options: { value: SortType; label: string }[] = [
        { value: 'random', label: 'Náhodně' },
        { value: 'id', label: 'Podle ID' },
        { value: 'least-answered', label: 'Nejméně zodpovězené' },
        { value: 'worst-ratio', label: 'Nejméně úspěšné' },
    ];

    return (
        <div className="relative min-w-0 flex-shrink sm:flex-initial">
            <div className="absolute left-1/2 sm:left-3 top-1/2 -translate-x-1/2 sm:translate-x-0 -translate-y-1/2 opacity-60 pointer-events-none sm:hidden">
                <ArrowUpDown size={14} style={{ color: 'var(--fg-primary)' }} />
            </div>
            <select
                className="focus-ring h-[44px] w-[44px] sm:w-auto appearance-none rounded-xl border pl-0 sm:pl-4 pr-0 sm:pr-10 text-[14px] font-medium transition-all duration-200 outline-none text-transparent sm:text-[var(--fg-primary)]"
                value={sortType}
                onChange={(e) => onSelectSort(e.target.value as SortType)}
                style={{
                    borderColor: 'color-mix(in srgb, var(--subject-primary) 20%, transparent)',
                    background: 'color-mix(in srgb, var(--subject-primary) 2%, rgba(255,255,255,0.03))',
                    backdropFilter: 'blur(10px)'
                }}
            >
                {options.map(option => (
                    <option
                        key={option.value}
                        value={option.value}
                        style={{ color: 'var(--fg-primary)', background: 'var(--bg-elevated)' }}
                    >
                        {option.label}
                    </option>
                ))}
            </select>
            <ChevronDown
                className="pointer-events-none absolute right-2.5 sm:right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60 hidden sm:block"
                style={{ color: 'var(--fg-primary)' }}
            />
        </div>
    );
}
