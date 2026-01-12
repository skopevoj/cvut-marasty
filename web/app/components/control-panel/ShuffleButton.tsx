'use client';

import { Shuffle } from "lucide-react";
import { IconButton } from "../ui/IconButton";

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
            variant="frosted"
            disabled={disabled}
        />
    );
}
