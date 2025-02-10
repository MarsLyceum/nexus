// hooks/useSearchFilter.ts
import { useMemo } from 'react';

/**
 * A custom hook for filtering an array of items based on a search query.
 *
 * @param items - The full list of items.
 * @param searchQuery - The current search string.
 * @param keys - The keys (properties) on which to search.
 * @returns The filtered array.
 */
export function useSearchFilter<T>(
    items: T[],
    searchQuery: string,
    keys: (keyof T)[]
): T[] {
    return useMemo(() => {
        if (!searchQuery.trim()) return items; // Return the original list if there's no search query.

        const lowerQuery = searchQuery.toLowerCase();
        return items.filter((item) =>
            keys.some((key) => {
                const value = item[key];
                return (
                    typeof value === 'string' &&
                    value.toLowerCase().includes(lowerQuery)
                );
            })
        );
    }, [items, searchQuery, keys]);
}
