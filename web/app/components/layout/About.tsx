'use client';

import { useState, useEffect } from 'react';

interface Contributor {
    login: string;
    avatar_url: string;
    html_url: string;
    contributions?: number;
}

interface ContributorsData {
    contributors: Contributor[];
    reporters: Contributor[];
}

function ContributorGroup({ title, users, highlight = false }: { title: string, users: Contributor[], highlight?: boolean }) {
    if (users.length === 0) return null;

    return (
        <div className="mt-12">
            <h2 className={`mb-6 text-xl font-semibold opacity-80 ${highlight ? 'text-[var(--subject-primary)]' : ''}`}>
                {title}
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
                {users.map(c => (
                    <a
                        key={c.login}
                        href={c.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative"
                        title={c.contributions ? `${c.login} (${c.contributions} příspěvků)` : c.login}
                    >
                        <img
                            src={c.avatar_url}
                            alt={c.login}
                            className={`rounded-full transition-all duration-300 group-hover:scale-110 shadow-sm ${highlight ? 'w-14 h-14 border-2 border-[var(--subject-primary)]' : 'w-12 h-12 border-2 border-transparent'}`}
                        />
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-[var(--surface-color)] text-[var(--fg-primary)] text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-[var(--border-color)] shadow-xl">
                            {c.login}
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}

function Recognition() {
    const [data, setData] = useState<ContributorsData | null>(null);
    const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

    useEffect(() => {
        fetch(`${BASE_PATH}/contributors.json?t=${Date.now()}`)
            .then(res => res.json())
            .then(val => {
                if (Array.isArray(val)) {
                    setData({ contributors: val, reporters: [] });
                } else {
                    setData(val);
                }
            })
            .catch(err => console.error('Failed to load recognition data', err));
    }, [BASE_PATH]);

    if (!data) return null;

    return (
        <>
            <ContributorGroup title="Přispěvatelé" users={data.contributors} highlight />
            <ContributorGroup title="Nahlásili chybu" users={data.reporters} />
        </>
    );
}


function GitHubStarButton() {
    return (
        <div className="relative inline-flex items-center group/container">
            <a
                href="https://github.com/skopevoj/cvut-marasty"
                target="_blank"
                rel="noopener noreferrer"
                className="relative inline-flex items-center gap-3 px-6 py-3 rounded-full font-medium transition-all duration-300 border border-yellow-600/30 bg-[rgba(255,255,255,0.03)] text-[var(--fg-primary)] hover:bg-[rgba(255,255,255,0.08)] hover:border-yellow-600 hover:scale-[1.02] active:scale-95 shadow-sm hover:shadow-[0_0_25px_rgba(255,215,0,0.2)]"
                aria-label="Star marasty on GitHub"
            >
                {/* Glow effect localized to button */}
                <div className="absolute inset-0 rounded-full bg-[var(--subject-primary)] opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500" />

                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    className="w-5 h-5 text-yellow-400 star-glow group-hover:animate-star-pop"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
                </svg>
                <span>Podpořte projekt hvězdou</span>
            </a>

            {/* Arrow pointing to button from the right */}
            <div className="rotate-10 absolute left-full ml-6 hidden md:block w-20 h-20 opacity-30 group-hover/container:opacity-80 transition-all duration-500 scale-x-[-1] -rotate-12 pointer-events-none">
                <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full stroke-[var(--subject-primary)]">
                    <path d="M56 270.5C56 256.429 79.5553 218.859 120.902 197.186C162.249 175.512 194.07 164.5 242.113 164.5C274.142 164.5 306.771 175.395 340 197.186" stroke="currentColor" strokeOpacity="0.9" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="16 32" />
                    <path d="M325.63 129C337.877 172.588 344 195.072 344 196.45C344 198.518 308.436 212.998 292 235" stroke="currentColor" strokeOpacity="0.9" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>

            <div className="rotate-170 absolute right-full mr-6 hidden md:block w-20 h-20 opacity-30 group-hover/container:opacity-80 transition-all duration-500 scale-x-[-1] -rotate-12 pointer-events-none">
                <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full stroke-[var(--subject-primary)]">
                    <path d="M56 270.5C56 256.429 79.5553 218.859 120.902 197.186C162.249 175.512 194.07 164.5 242.113 164.5C274.142 164.5 306.771 175.395 340 197.186" stroke="currentColor" strokeOpacity="0.9" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="16 32" />
                    <path d="M325.63 129C337.877 172.588 344 195.072 344 196.45C344 198.518 308.436 212.998 292 235" stroke="currentColor" strokeOpacity="0.9" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        </div>
    );
}


export function About() {
    return (
        <div className="quiz-container py-24 text-center max-w-3xl mx-auto">
            <h1 className="mb-8 text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--fg-primary)] to-[var(--subject-primary)]">
                O Projektu
            </h1>

            <p className="mb-6 text-xl text-[var(--fg-muted)] leading-relaxed">
                Toto repo se snaží shromažďovat otázky z předmětů na FIT ČVUT. Cílem je zabránit tomu, co se děje na fitiwki (20 různých souborů s otázkami, různé formáty, neaktuální data, atd.) a vytvořit jednotný zdroj pro otázky.
            </p>

            <p className="mb-10 text-xl text-[var(--fg-muted)] leading-relaxed">
                Proto pokud najdete jakoukoliv chybu, nahlašte ji prosím přes <a href="https://github.com/skopevoj/cvut-marasty/issues" className="text-[var(--subject-primary)] hover:underline font-medium" target="_blank" rel="noopener noreferrer">GitHub Issues</a> nebo ještě lépe, přispějte opravou sami přes <a href="https://github.com/skopevoj/cvut-marasty/pulls" className="text-[var(--subject-primary)] hover:underline font-medium" target="_blank" rel="noopener noreferrer">GitHub Pull Requests</a>.
            </p>

            <div className="flex justify-center items-center mb-16">
                <GitHubStarButton />
            </div>

            <Recognition />
        </div>
    );
}
