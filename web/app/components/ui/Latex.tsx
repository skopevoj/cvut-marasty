"use client";

import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

type LatexProps = {
    tex?: string | null;
    className?: string;
};

export default function Latex({ tex, className }: LatexProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const actualContent = (tex ?? "").toString();

    useEffect(() => {
        if (!containerRef.current) return;

        const processLatex = (textToProcess: string) => {
            if (!textToProcess || typeof textToProcess !== "string") return "";

            // Replace display math $$ ... $$ first
            let processed = textToProcess.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
                try {
                    return katex.renderToString(math, { displayMode: true, throwOnError: false });
                } catch (e) {
                    return `$$${math}$$`;
                }
            });

            // Then replace inline math $ ... $
            processed = processed.replace(/\$(.*?)\$/g, (_, math) => {
                try {
                    return katex.renderToString(math, { displayMode: false, throwOnError: false });
                } catch (e) {
                    return `$${math}$`;
                }
            });

            return processed;
        };

        containerRef.current.innerHTML = processLatex(actualContent);
    }, [actualContent]);

    return <div ref={containerRef} className={className} />;
}
