'use client';

import { Star, Pencil, ImageIcon } from "lucide-react";
import { IconButton } from "../IconButton";

interface QuestionActionsProps {
    hasQuizPhoto: boolean;
    showQuizPhoto: boolean;
    onToggleQuizPhoto: () => void;
}

export function QuestionActions({ hasQuizPhoto, showQuizPhoto, onToggleQuizPhoto }: QuestionActionsProps) {
    return (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
            {hasQuizPhoto && (
                <IconButton
                    onClick={onToggleQuizPhoto}
                    icon={ImageIcon}
                    active={showQuizPhoto}
                    title="Zobrazit detailní obrázek"
                    size={16}
                />
            )}
            <IconButton
                icon={Pencil}
                title="Navrhnout úpravu"
                size={16}
            />
            <IconButton
                icon={Star}
                size={20}
                className="[&_svg]:hover:text-yellow-400 [&_svg]:transition-all [&_svg]:duration-300"
            />
        </div>
    );
}
