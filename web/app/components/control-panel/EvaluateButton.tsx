'use client';

interface EvaluateButtonProps {
    onClick: () => void;
    disabled: boolean;
    showResults: boolean;
}

export function EvaluateButton({ onClick, disabled, showResults }: EvaluateButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 md:px-6 md:py-2.5 md:text-sm"
            style={{
                background: 'var(--subject-primary)',
                boxShadow: `
                    0 0 0 1px color-mix(in srgb, var(--subject-primary) 50%, transparent),
                    0 4px 12px color-mix(in srgb, var(--subject-primary) 25%, transparent),
                    inset 0 4px 6px 0 rgba(255, 255, 255, 0.4)
                `,
            }}
        >
            {showResults ? 'Další otázka' : 'Vyhodnotit'}
        </button>
    );
}
