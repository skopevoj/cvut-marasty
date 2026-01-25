"use client";

import { SortType } from "../../lib/types/enums";
import { ChevronDown, ArrowUpDown } from "lucide-react";

interface SortSelectorProps {
  sortType: SortType;
  onSelectSort: (type: SortType) => void;
}

export function SortSelector({ sortType, onSelectSort }: SortSelectorProps) {
  const options: { value: SortType; label: string }[] = [
    { value: SortType.RANDOM, label: "Náhodně" },
    { value: SortType.ID, label: "ID" },
    { value: SortType.LEAST_ANSWERED, label: "Nejméně zodpovězené" },
    { value: SortType.WORST_RATIO, label: "Nejhorší úspěšnost" },
  ];

  return (
    <div className="relative min-w-0 flex-shrink sm:flex-initial group">
      <div className="absolute left-1/2 sm:left-3 top-1/2 -translate-x-1/2 sm:translate-x-0 -translate-y-1/2 opacity-50 pointer-events-none sm:hidden group-hover:opacity-80 transition-opacity">
        <ArrowUpDown size={14} style={{ color: "var(--fg-primary)" }} />
      </div>
      <select
        className="glass-dropdown focus-ring w-[40px] sm:w-auto appearance-none pl-0 sm:pl-4 pr-0 sm:pr-10 shadow-sm text-transparent sm:text-[var(--fg-primary)]"
        value={sortType}
        onChange={(e) => onSelectSort(e.target.value as SortType)}
        style={{
          color: "var(--fg-primary)",
        }}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            style={{
              color: "var(--fg-primary)",
              background: "var(--bg-elevated)",
            }}
          >
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 sm:right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 group-hover:opacity-80 transition-opacity hidden sm:block"
        style={{ color: "var(--fg-primary)" }}
      />
    </div>
  );
}
