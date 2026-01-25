"use client";

import Latex from "./Latex";

interface TextRendererProps {
    text: string;
}

interface TextSegment {
    type: "text" | "code" | "inline-code";
    content: string;
}

function parseTextWithCodeBlocks(text: string): TextSegment[] {
    const segments: TextSegment[] = [];
    const codeBlockRegex = /```([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
        // Add text before code block (may contain inline code)
        if (match.index > lastIndex) {
            const textBefore = text.slice(lastIndex, match.index);
            segments.push(...parseInlineCode(textBefore));
        }

        // Add code block
        segments.push({
            type: "code",
            content: match[1].trim(),
        });

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text (may contain inline code)
    if (lastIndex < text.length) {
        const remainingText = text.slice(lastIndex);
        segments.push(...parseInlineCode(remainingText));
    }

    return segments.length > 0 ? segments : [{ type: "text", content: text }];
}

function parseInlineCode(text: string): TextSegment[] {
    const segments: TextSegment[] = [];
    const inlineCodeRegex = /`([^`]+)`/g;
    let lastIndex = 0;
    let match;

    while ((match = inlineCodeRegex.exec(text)) !== null) {
        // Add text before inline code
        if (match.index > lastIndex) {
            segments.push({
                type: "text",
                content: text.slice(lastIndex, match.index),
            });
        }

        // Add inline code
        segments.push({
            type: "inline-code",
            content: match[1],
        });

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        segments.push({
            type: "text",
            content: text.slice(lastIndex),
        });
    }

    return segments.length > 0 ? segments : [{ type: "text", content: text }];
}

export function TextRenderer({ text }: TextRendererProps) {
    const segments = parseTextWithCodeBlocks(text);

    return (
        <div className="inline-flex flex-wrap items-baseline gap-1">
            {segments.map((segment, index) => {
                if (segment.type === "code") {
                    return (
                        <pre
                            key={index}
                            className="w-full rounded-lg bg-text-primary/[0.08] px-3 py-2 text-sm overflow-x-auto my-1"
                        >
                            <code className="text-text-primary font-mono whitespace-pre">
                                {segment.content}
                            </code>
                        </pre>
                    );
                } else if (segment.type === "inline-code") {
                    return (
                        <code
                            key={index}
                            className="rounded bg-text-primary/[0.08] px-1.5 py-0.5 text-sm font-mono text-text-primary"
                        >
                            {segment.content}
                        </code>
                    );
                } else {
                    return segment.content.trim() ? (
                        <span key={index} className="inline">
                            <Latex tex={segment.content} />
                        </span>
                    ) : null;
                }
            })}
        </div>
    );
}

export default TextRenderer;
