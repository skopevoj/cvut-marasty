'use client';

export function Footer() {
    return (
        <footer className="mt-auto py-0 z-1">
            <div className="flex flex-col items-center justify-center gap-4 text-[var(--fg-muted)]">
                <div className="flex items-center gap-6">
                    <a
                        href="https://github.com/skopevoj/cvut-marasty"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm transition-colors hover:text-[var(--fg-primary)]"
                    >
                        <div
                            className="w-[18px] h-[18px] bg-current"
                            style={{
                                maskImage: 'url(/resource/github.svg)',
                                WebkitMaskImage: 'url(/resource/github.svg)',
                                maskSize: 'contain',
                                maskRepeat: 'no-repeat'
                            }}
                        />
                        <span>GitHub</span>
                    </a>
                    <div className="flex items-center gap-2 text-sm transition-colors hover:text-[var(--fg-primary)] cursor-default">
                        <div
                            className="w-[18px] h-[18px] bg-current"
                            style={{
                                maskImage: 'url(/resource/discord.svg)',
                                WebkitMaskImage: 'url(/resource/discord.svg)',
                                maskSize: 'contain',
                                maskRepeat: 'no-repeat'
                            }}
                        />
                        <span>darkkw</span>
                    </div>
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] opacity-40">
                    Build: {process.env.NEXT_PUBLIC_BUILD_TIME ? new Date(process.env.NEXT_PUBLIC_BUILD_TIME).toLocaleString('cs-CZ', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    }) : 'Unknown'}
                </div>
                {/* <div className="text-[10px] uppercase tracking-[0.2em] opacity-40">
                    © {new Date().getFullYear()} CVUT Marasty
                </div> */}
            </div>
        </footer>
    );
}
