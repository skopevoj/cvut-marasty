"use client";

import { useEffect, useRef } from "react";
import "katex/dist/katex.min.css";
import renderMathInElement from "katex/contrib/auto-render";

type LatexProps = {
    tex?: string | null;
    className?: string;
};

export default function Latex({ tex, className }: LatexProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const actualContent = (tex ?? "").toString();

    useEffect(() => {
        if (!containerRef.current) return;

        // Vložíme text do elementu
        containerRef.current.textContent = actualContent;

        // Necháme KaTeX automaticky najít a vykreslit matematiku
        renderMathInElement(containerRef.current, {
            delimiters: [
                { left: "$$", right: "$$", display: true },
                { left: "\\[", right: "\\]", display: true },
                { left: "\\(", right: "\\)", display: false },
                { left: "$", right: "$", display: false },
            ],
            throwOnError: false,
        });
    }, [actualContent]);

    return <div ref={containerRef} className={className} />;
}
