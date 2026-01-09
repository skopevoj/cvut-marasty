'use client';

import { useEffect, ReactNode } from 'react';
import { useSettings } from './SettingsContext';

/**
 * ThemeProvider is responsible for syncing the theme setting 
 * with the document's data-theme attribute and handling 
 * system preference fallbacks.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
    const { settings, updateSetting } = useSettings();

    useEffect(() => {
        // Apply theme to DOM
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', settings.theme);
        }
    }, [settings.theme]);

    return <>{children}</>;
}
