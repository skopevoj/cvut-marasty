import { useState, useEffect } from 'react';

const FAVORITES_KEY = 'quiz-favorites';

export const favoritesHelper = {
    getFavorites: (): string[] => {
        if (typeof window === 'undefined') return [];
        const saved = localStorage.getItem(FAVORITES_KEY);
        if (!saved) return [];
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to parse favorites', e);
            return [];
        }
    },

    toggleFavorite: (questionId: string): boolean => {
        const favorites = favoritesHelper.getFavorites();
        const index = favorites.indexOf(questionId);
        let isFavorite = false;

        if (index === -1) {
            favorites.push(questionId);
            isFavorite = true;
        } else {
            favorites.splice(index, 1);
            isFavorite = false;
        }

        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        window.dispatchEvent(new CustomEvent('favorites-updated'));
        return isFavorite;
    },

    isFavorite: (questionId: string): boolean => {
        const favorites = favoritesHelper.getFavorites();
        return favorites.includes(questionId);
    }
};

export function useFavorites() {
    const [favorites, setFavorites] = useState<string[]>([]);

    useEffect(() => {
        setFavorites(favoritesHelper.getFavorites());

        const handleUpdate = () => {
            setFavorites(favoritesHelper.getFavorites());
        };

        window.addEventListener('favorites-updated', handleUpdate);
        return () => window.removeEventListener('favorites-updated', handleUpdate);
    }, []);

    return favorites;
}
