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
            className="glass-button group"
        >
            {/* Content with high-contrast text shadow for Apple-style clarity */}
            <span className="relative z-10 flex items-center justify-center gap-2 tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                <span className="md:hidden">
                    {showResults ? 'Další' : 'Vyhodnotit'}
                </span>
                <span className="hidden md:inline">
                    {showResults ? 'Další otázka' : 'Vyhodnotit'}
                </span>
            </span>
        </button>
    );
}    
