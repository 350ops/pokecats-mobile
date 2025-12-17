// Cat appearance constants for color and pattern selection
// Note: labelKey is used for i18n lookup

export const CAT_COLORS = [
    { value: 'black', labelKey: 'black', hex: '#1a1a1a' },
    { value: 'white', labelKey: 'white', hex: '#f5f5f5' },
    { value: 'grey', labelKey: 'grey', hex: '#808080' },
    { value: 'brown', labelKey: 'brown', hex: '#8B4513' },
    { value: 'orange', labelKey: 'orange', hex: '#FF8C00' },
    { value: 'cream', labelKey: 'cream', hex: '#FFFDD0' },
    { value: 'mixed', labelKey: 'mixed', hex: null },
] as const;

export const CAT_PATTERNS = [
    { value: 'solid', labelKey: 'solid' },
    { value: 'tabby', labelKey: 'tabby' },
    { value: 'spotted', labelKey: 'spotted' },
    { value: 'bicolour', labelKey: 'bicolor' },
    { value: 'calico', labelKey: 'calico' },
    { value: 'tortoiseshell', labelKey: 'tortoiseshell' },
    { value: 'pointed', labelKey: 'pointed' },
    { value: 'unknown', labelKey: 'unknown' },
] as const;

export type CatColor = typeof CAT_COLORS[number]['value'];
export type CatPattern = typeof CAT_PATTERNS[number]['value'];

// Helper to get label from value (fallback for non-i18n contexts)
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

