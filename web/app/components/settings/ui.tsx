"use client";

import React from "react";

export const SettingRow = ({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 md:py-5 border-b border-[var(--border-default)] last:border-0 gap-3">
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-medium text-[var(--fg-primary)]">
        {label}
      </span>
      {description && (
        <span className="text-[11px] md:text-xs text-[var(--fg-muted)]">
          {description}
        </span>
      )}
    </div>
    <div className="flex justify-end">{children}</div>
  </div>
);

export const SettingInput = ({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}) => (
  <input
    type="text"
    value={value || ""}
    onChange={onChange}
    placeholder={placeholder}
    className={`bg-[var(--fg-primary)]/5 border border-[var(--border-default)] text-[var(--fg-primary)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--subject-primary)] transition-all ${className}`}
  />
);

export const Toggle = ({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`relative w-10 md:w-11 h-5 md:h-6 rounded-full transition-all duration-300 ${
      active ? "bg-[var(--subject-primary)]" : "bg-[var(--fg-muted)]/20"
    }`}
  >
    <div
      className={`absolute top-0.5 md:top-1 left-0.5 md:left-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm ${
        active ? "translate-x-5" : ""
      }`}
    />
  </button>
);
