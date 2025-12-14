// Cat appearance constants for color and pattern selection

export const CAT_COLORS = [
    { value: 'black', label: 'Black', hex: '#1a1a1a' },
    { value: 'white', label: 'White', hex: '#f5f5f5' },
    { value: 'grey', label: 'Grey', hex: '#808080' },
    { value: 'brown', label: 'Brown', hex: '#8B4513' },
    { value: 'orange', label: 'Orange (Ginger)', hex: '#FF8C00' },
    { value: 'cream', label: 'Cream', hex: '#FFFDD0' },
    { value: 'mixed', label: 'Mixed / Multicolour', hex: null },
] as const;

export const CAT_PATTERNS = [
    { value: 'solid', label: 'Solid' },
    { value: 'tabby', label: 'Tabby (Striped)' },
    { value: 'spotted', label: 'Spotted' },
    { value: 'bicolour', label: 'Bicolour (Two colors)' },
    { value: 'calico', label: 'Calico' },
    { value: 'tortoiseshell', label: 'Tortoiseshell' },
    { value: 'pointed', label: 'Pointed (Siamese-like)' },
    { value: 'unknown', label: 'Unknown' },
] as const;

export type CatColor = typeof CAT_COLORS[number]['value'];
export type CatPattern = typeof CAT_PATTERNS[number]['value'];

// Helper to get label from value
export const getColorLabel = (color: string) => {
    return color.charAt(0).toUpperCase() + color.slice(1);
};

export const getPatternLabel = (pattern: string) => {
    return pattern.charAt(0).toUpperCase() + pattern.slice(1);
};

export const formatCatAppearance = (cat: { primaryColor?: string | null; pattern?: string | null; sex?: string }) => {
    const parts: string[] = [];
    if (cat.primaryColor) parts.push(getColorLabel(cat.primaryColor));
    if (cat.pattern && cat.pattern !== 'unknown') parts.push(getPatternLabel(cat.pattern));
    if (parts.length === 0) {
        if (cat.sex && cat.sex !== 'unknown') return cat.sex.charAt(0).toUpperCase() + cat.sex.slice(1);
        return 'Unknown';
    }
    return parts.join(' • ');
};
