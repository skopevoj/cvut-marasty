'use client';

import { useEffect, useRef } from 'react';
import katex from 'katex';

interface LatexRendererProps {
    content: string;
    className?: string;
    inline?: boolean;
}

export function LatexRenderer({ content, className = '', inline = false }: LatexRendererProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Process the content to find and render LaTeX
        const processedContent = content.replace(/\$\$(.+?)\$\$/g, (_, latex) => {
            try {
                return katex.renderToString(latex, { displayMode: true, throwOnError: false });
            } catch (e) {
                return `$$${latex}$$`;
            }
        }).replace(/\$(.+?)\$/g, (_, latex) => {
            try {
                return katex.renderToString(latex, { displayMode: false, throwOnError: false });
            } catch (e) {
                return `$${latex}$`;
            }
        });

        containerRef.current.innerHTML = processedContent;
    }, [content]);

    return (
        <div
            ref={containerRef}
            className={`latex-content ${className}`}
            style={{ display: inline ? 'inline' : 'block' }}
        />
    );
}
