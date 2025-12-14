import { ExtensionStorage } from '@bacons/apple-targets';

const APP_GROUP = 'group.com.mmdev.pokecats';
const STORAGE_KEY = 'widgetData';

const storage = new ExtensionStorage(APP_GROUP);

export interface WidgetCat {
    id: number;
    name: string;
    distance?: string;
    lastFed?: string;
    status?: string;
    image?: string;
}

export interface WidgetData {
    totalNearby: number;
    cats: WidgetCat[];
    lastUpdated: string;
}

export const updateWidgetData = async (cats: any[]) => {
    try {
        const timestamp = new Date().toISOString();

        // Transform app cats to widget cats (simplified data)
        const widgetCats: WidgetCat[] = cats.slice(0, 3).map(cat => ({
            id: cat.id,
            name: cat.name,
            distance: cat.distance || 'Unknown',
            lastFed: cat.lastFed ? new Date(cat.lastFed).toISOString() : undefined,
            status: cat.status || 'Unknown',
            image: cat.image,
        }));

        const data: WidgetData = {
            totalNearby: cats.length,
            cats: widgetCats,
            lastUpdated: timestamp,
        };

        // Save to ExtensionStorage (UserDefaults)
        storage.set(STORAGE_KEY, JSON.stringify(data));

        // Trigger widget reload
        ExtensionStorage.reloadWidget();
        console.log('Widget data updated and reload triggered');

    } catch (error) {
        console.error('Failed to update widget data:', error);
    }
};
