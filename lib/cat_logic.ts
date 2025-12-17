// Basic interface for what we need to calculate status
export interface StatusCat {
    id?: number | string;
    lastFed?: string | Date | null;
    status?: string;
}

export type CatStatusState = {
    statusText: string;
    statusColor: string; // Hex color for Badge/Text
    markerColor: string; // Color name or hex for Marker
    labelColor: string; // Text color inside badge (usually white or dark)
};

export const getCatStatusState = (cat: StatusCat): CatStatusState => {
    const now = Date.now();
    const lastFed = cat.lastFed instanceof Date ? cat.lastFed.getTime() : (cat.lastFed ? new Date(cat.lastFed).getTime() : 0);
    const hoursSinceFed = lastFed > 0 ? (now - lastFed) / (1000 * 60 * 60) : 999; // Treat unknown/never as very long ago

    const statusLower = (cat.status || '').toLowerCase();

    // Priority 1: "Needs Help" OR "Last Fed > 18h" -> Red/Severe
    // OR if status is explicitly "Hungry" (though we calculate this dynamically usually)
    if (statusLower === 'needs help' || hoursSinceFed > 18) {
        return {
            statusText: statusLower === 'needs help' ? 'Needs Help' : 'Hungry',
            statusColor: '#FF453A', // User Red
            markerColor: '#FF453A',
            labelColor: '#ffffff'
        };
    }

    // Priority 2: "Healthy" (or undefined or explicitly "Hungry") AND "Last Fed > 8h" -> Amber/Hungry
    if (statusLower === 'healthy' || statusLower === 'hungry' || !cat.status) {
        if (hoursSinceFed > 8) {
            return {
                statusText: 'Hungry',
                statusColor: '#FF9F0A', // User Orange
                markerColor: '#FF9F0A',
                labelColor: '#ffffff'
            };
        }

        // Priority 3: "Healthy" AND "Last Fed <= 8h" -> Green/Healthy
        return {
            statusText: 'Healthy',
            statusColor: '#12C82D', // User Green
            markerColor: '#12C82D',
            labelColor: '#ffffff'
        };
    }

    // Fallback
    return {
        statusText: cat.status || 'Unknown',
        statusColor: '#999999',
        markerColor: '#999999',
        labelColor: '#ffffff'
    };
};
