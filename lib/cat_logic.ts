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
            statusText: statusLower === 'needs help' ? 'Needs Help' : 'Hungry', // Keep 'Needs Help' if explicit, else 'Hungry' for time-based
            statusColor: '#ff4d4d', // Red
            markerColor: 'red',
            labelColor: '#ffffff'
        };
    }

    // Priority 2: "Healthy" (or undefined or explicitly "Hungry") AND "Last Fed > 8h" -> Amber/Hungry
    // If it was marked "Hungry" but is now fed, it should become Healthy (Green) if < 8h
    if (statusLower === 'healthy' || statusLower === 'hungry' || !cat.status) {
        if (hoursSinceFed > 8) {
            return {
                statusText: 'Hungry',
                statusColor: '#FFA500', // Amber/Orange
                markerColor: 'orange',
                labelColor: '#ffffff'
            };
        }

        // Priority 3: "Healthy" AND "Last Fed <= 8h" -> Green/Healthy
        return {
            statusText: 'Healthy',
            statusColor: 'rgb(133, 229, 105)', // Green
            markerColor: 'green',
            labelColor: '#ffffff'
        };
    }

    // Fallback for Adopted or other statuses
    return {
        statusText: cat.status || 'Unknown',
        statusColor: '#999999',
        markerColor: 'grey',
        labelColor: '#ffffff'
    };
};
