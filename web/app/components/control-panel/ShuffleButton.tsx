'use client';

import { Shuffle } from "lucide-react";
import { IconButton } from "../IconButton";

interface ShuffleButtonProps {
    onClick: () => void;
    disabled: boolean;
}

export function ShuffleButton({ onClick, disabled }: ShuffleButtonProps) {
    return (
        <IconButton
            onClick={onClick}
            icon={Shuffle}
            title="Zamíchat otázky"
            disabled={disabled}
        />
    );
}
