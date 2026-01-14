'use client';

import { useEffect, useState } from 'react';
import { Github, Star, Heart } from 'lucide-react';

interface Contributor {
    login: string;
    avatar_url: string;
    html_url: string;
    contributions: number;
}

interface Metadata {
    stargazers_count: number;
    contributors: Contributor[];
}

export function Contributors() {
    const [metadata, setMetadata] = useState<Metadata | null>(null);

    useEffect(() => {
        fetch('/metadata.json')
            .then(res => res.json())
            .then(data => setMetadata(data))
            .catch(err => console.error('Failed to load contributors', err));
    }, []);

    if (!metadata || metadata.contributors.length === 0) return null;

    return (
        <div className="w-full space-y-8 pt-8 pb-4 mt-8">
            <div className="flex flex-col items-center gap-6">
                <div className="text-center space-y-3">
                    <div className="flex flex-col items-center gap-4">
                        <a
                            href="https://github.com/skopevoj/cvut-marasty"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="glass-card-themed px-5 py-2.5 flex items-center gap-4 hover:scale-105 transition-all group"
                        >
                            <Github size={22} className="text-[var(--fg-primary)]" />
                            <span className="font-semibold text-[var(--fg-primary)]">
                                CVUT Marasty
                            </span>
                            <div className="w-[1px] h-5 bg-white/10" />
                            <div className="flex items-center gap-2">
                                <Star size={18} className="text-yellow-500 fill-yellow-500 group-hover:animate-star-pop" />
                                <span className="font-bold text-base text-[var(--fg-primary)]">
                                    {metadata.stargazers_count}
                                </span>
                            </div>
                        </a>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-[var(--fg-muted)]">
                        <span className="h-px w-8 bg-gradient-to-r from-transparent to-[var(--fg-muted)]/30" />
                        <p className="text-sm font-medium italic">
                            Děkujeme všem za pomoc s vylepšováním projektu
                        </p>
                        <Heart size={14} className="text-red-500 fill-red-500 animate-pulse" />
                        <span className="h-px w-8 bg-gradient-to-l from-transparent to-[var(--fg-muted)]/30" />
                    </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-6 max-w-2xl px-4">
                    {metadata.contributors.map((contributor) => (
                        <a
                            key={contributor.login}
                            href={contributor.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative flex flex-col items-center gap-2"
                        >
                            <div className="relative">
                                <img
                                    src={contributor.avatar_url}
                                    alt={contributor.login}
                                    className="w-12 h-12 rounded-full border-2 border-white/10 group-hover:border-[var(--primary-color)] transition-all duration-300 shadow-lg object-cover"
                                />
                                <div className="absolute inset-0 rounded-full bg-[var(--primary-color)]/20 opacity-0 group-hover:opacity-100 transition-opacity blur-md -z-10" />
                            </div>
                            <span className="text-[10px] font-medium text-[var(--fg-muted)] group-hover:text-[var(--fg-primary)] transition-colors truncate w-14 text-center">
                                {contributor.login}
                            </span>

                            {/* Tooltip on hover */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[var(--bg-elevated)] text-[var(--fg-primary)] text-xs px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-50 border border-white/10 shadow-2xl scale-90 group-hover:scale-100 translate-y-2 group-hover:translate-y-0">
                                <div className="font-bold">{contributor.login}</div>
                                <div className="text-[var(--fg-muted)] text-[10px]">{contributor.contributions} příspěvků</div>
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[var(--bg-elevated)] border-b border-r border-white/10 rotate-45" />
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </div >
    );
}
