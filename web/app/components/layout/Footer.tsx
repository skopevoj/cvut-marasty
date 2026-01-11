'use client';

export function Footer() {
    return (
        <footer className="mt-auto py-0 z-1">
            <div className="flex flex-col items-center justify-center gap-4 text-[var(--fg-muted)]">
                {/* <div className="flex items-center gap-6">
                    <a
                        href="https://github.com/skopevoj/cvut-marasty"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm transition-colors hover:text-[var(--fg-primary)]"
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-[18px] h-[18px] text-current"
                        >
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.987 1.029-2.686-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.699 1.028 1.593 1.028 2.686 0 3.847-2.337 4.695-4.566 4.944.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .268.18.58.688.482C19.138 20.2 22 16.448 22 12.021 22 6.484 17.523 2 12 2z"
                                fill="currentColor"
                            />
                        </svg>
                        <span>GitHub</span>
                    </a>
                    <div className="flex items-center gap-2 text-sm transition-colors hover:text-[var(--fg-primary)] cursor-default">
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 71 55"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-[18px] h-[18px] text-current"
                        >
                            <path
                                d="M60.104 4.552A58.864 58.864 0 0 0 46.852.8a.117.117 0 0 0-.124.06c-2.05 3.614-4.338 8.32-5.953 12.06-7.12-1.08-14.12-1.08-21.08 0-1.615-3.76-3.903-8.466-5.953-12.06A.117.117 0 0 0 13.148.8a58.96 58.96 0 0 0-13.252 3.752.105.105 0 0 0-.05.041C-1.58 18.73-2.943 32.66.293 46.457a.12.12 0 0 0 .045.082c5.58 4.09 11.02 6.58 16.39 8.23a.117.117 0 0 0 .127-.042c1.26-1.73 2.38-3.56 3.34-5.48a.112.112 0 0 0-.065-.16c-1.79-.68-3.5-1.5-5.17-2.42a.117.117 0 0 1-.012-.195c.348-.263.696-.53 1.03-.8a.112.112 0 0 1 .114-.013c10.84 4.96 22.57 4.96 33.34 0a.112.112 0 0 1 .115.012c.334.27.682.537 1.03.8a.117.117 0 0 1-.011.195c-1.67.92-3.38 1.74-5.17 2.42a.112.112 0 0 0-.064.16c.96 1.92 2.08 3.75 3.34 5.48a.117.117 0 0 0 .127.042c5.38-1.65 10.82-4.14 16.39-8.23a.117.117 0 0 0 .045-.082c1.5-6.36 2.36-12.77 2.06-19.14-.03-.06-.03-.12-.06-.18ZM23.725 37.28c-3.23 0-5.88-2.96-5.88-6.6 0-3.64 2.61-6.6 5.88-6.6 3.29 0 5.92 2.98 5.88 6.6 0 3.64-2.61 6.6-5.88 6.6Zm23.55 0c-3.23 0-5.88-2.96-5.88-6.6 0-3.64 2.61-6.6 5.88-6.6 3.29 0 5.92 2.98 5.88 6.6 0 3.64-2.61 6.6-5.88 6.6Z"
                                fill="currentColor"
                            />
                        </svg>
                        <span>darkkw</span>
                    </div>
                </div> */}
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
