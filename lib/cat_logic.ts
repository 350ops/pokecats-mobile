import { Cat } from "@/constants/MockData";

export type CatStatusState = {
    statusText: string;
    statusColor: string; // Hex color for Badge/Text
    markerColor: string; // Color name or hex for Marker
    labelColor: string; // Text color inside badge (usually white or dark)
};

export const getCatStatusState = (cat: Partial<Cat>): CatStatusState => {
    const now = Date.now();
    const lastFed = cat.lastFed instanceof Date ? cat.lastFed.getTime() : (cat.lastFed ? new Date(cat.lastFed).getTime() : 0);
    const hoursSinceFed = lastFed > 0 ? (now - lastFed) / (1000 * 60 * 60) : 999; // Treat unknown/never as very long ago

    const statusLower = (cat.status || '').toLowerCase();

    // Priority 1: "Needs Help" OR "Last Fed > 18h" -> Red/Severe
    if (statusLower === 'needs help') {
        return {
            statusText: 'Needs Help',
            statusColor: '#ff4d4d', // Red
            markerColor: 'red',
            labelColor: '#ffffff'
        };
    }

    if (hoursSinceFed > 18) {
        // User said: "if marked needs help or last fed more than 18 hours ago mark red"
        // Doesn't strictly say change the text to 'Needs Help', but implies urgency.
        // However, later: "add an amber color badge if... last fed > 8h... say Hungry".
        // If > 18h, it's definitely > 8h. Should it maintain "Hungry" but be red?
        // Or become "Needs Help"? Let's assume >18h implies such hunger it's "Needs Help" equivalent visibility.
        // BUT, to keep it distinct, let's say "Hungry" (Red) or "Starving"?
        // Let's stick to the prompt's explicit red marker. For badge, prompt only mentioned Amber/Hungry for >8h.
        // Let's use "Hungry" with Red badge for >18h to signal urgency.
        return {
            statusText: 'Hungry',
            statusColor: '#ff4d4d', // Red
            markerColor: 'red',
            labelColor: '#ffffff'
        };
    }

    // Priority 2: "Healthy" AND "Last Fed > 8h" -> Amber/Hungry
    if (statusLower === 'healthy' || !cat.status) {
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
            labelColor: '#ffffff' // Or dark? User asked for white text on healthy tag previously?
            // Previous request: "Healthy tag background... with white text".
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
