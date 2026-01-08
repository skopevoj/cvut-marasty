'use client';

import { Github, MessageSquare } from 'lucide-react';

export function Footer() {
    return (
        <footer className="mt-auto py-0">
            <div className="flex flex-col items-center justify-center gap-4 text-[var(--fg-muted)]">
                <div className="flex items-center gap-6">
                    <a
                        href="https://github.com/skopevoj/cvut-marasty"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm transition-colors hover:text-[var(--fg-primary)]"
                    >
                        <Github size={18} />
                        <span>GitHub</span>
                    </a>
                    <div className="flex items-center gap-2 text-sm transition-colors hover:text-[var(--fg-primary)] cursor-default">
                        <MessageSquare size={18} />
                        <span>Discord: <span className="font-medium text-[var(--fg-primary)]">darkkw</span></span>
                    </div>
                </div>
                {/* <div className="text-[10px] uppercase tracking-[0.2em] opacity-40">
                    © {new Date().getFullYear()} CVUT Marasty
                </div> */}
            </div>
        </footer>
    );
}
