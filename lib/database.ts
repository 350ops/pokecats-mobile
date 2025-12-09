import { MOCK_CATS } from '@/constants/MockData';
import { supabase } from './supabase';

// We no longer use expo-sqlite directly for data, but could use it for offline caching if we wanted to get fancy.
// For this migration, we are fetching directly from Supabase.

export const initDatabase = async () => {
    // No-op for Supabase as schema is managed on server
    // We can use this to check connection or seed data
    console.log('Using Supabase backend');
};

export const addCat = async (name: string, description: string, image: string, latitude: number, longitude: number) => {
    const { error } = await supabase
        .from('cats')
        .insert({
            name,
            description,
            image,
            latitude,
            longitude,
            status: 'Needs Help',
            breed: 'Unknown',
            last_sighted: new Date().toISOString()
        });

    if (error) console.error('Error adding cat:', error);
};

export const updateCat = async (id: number, updates: { latitude?: number; longitude?: number; lastFed?: string; lastSighted?: string }) => {
    const dbUpdates: any = {};
    if (updates.latitude) dbUpdates.latitude = updates.latitude;
    if (updates.longitude) dbUpdates.longitude = updates.longitude;
    if (updates.lastFed) dbUpdates.last_fed = updates.lastFed;
    if (updates.lastSighted) dbUpdates.last_sighted = updates.lastSighted;

    const { error } = await supabase
        .from('cats')
        .update(dbUpdates)
        .eq('id', id);

    if (error) console.error('Error updating cat:', error);
};

export const getCat = async (id: number) => {
    const { data, error } = await supabase
        .from('cats')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error getting cat:', error);
        return null;
    }

    // Map DB fields to app fields (snake_case to camelCase)
    return {
        ...data,
        lastFed: data.last_fed,
        lastSighted: data.last_sighted,
        createdAt: data.created_at
    };
};

export const addTranslation = async (catId: number, translation: string, sentiment: string) => {
    const { error } = await supabase
        .from('cat_translations')
        .insert({ cat_id: catId, translation, sentiment });

    if (error) console.error('Error adding translation:', error);
};

export const getTranslationHistory = async (catId: number) => {
    const { data, error } = await supabase
        .from('cat_translations')
        .select('*')
        .eq('cat_id', catId)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error getting translation history:', error);
        return [];
    }
    return data;
};

export const getCats = async () => {
    const { data, error } = await supabase
        .from('cats')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error getting cats:', error);
        return [];
    }

    // Map snake_case to camelCase
    return data.map((cat: any) => ({
        ...cat,
        lastFed: cat.last_fed,
        lastSighted: cat.last_sighted,
        createdAt: cat.created_at
    }));
};

export const addFeeding = async (catId: number, foodType: string, amount: string, shared: boolean) => {
    const { error } = await supabase
        .from('cat_feedings')
        .insert({
            cat_id: catId,
            food_type: foodType,
            amount: amount,
            shared_with_others: shared
        });

    if (error) console.error('Error adding feeding:', error);
};

export const seedDatabase = async () => {
    console.log('Resetting and Seeding Supabase...');

    // 1. Clear existing data to remove random/sea locations
    const { error: deleteError } = await supabase.from('cats').delete().neq('id', 0);
    if (deleteError) console.error('Error clearing cats:', deleteError);

    // 2. User specified locations (Doha)
    const specificCats = [
        { ...MOCK_CATS[0], lat: 25.37131849132432, lon: 51.558225818651536 },
        { ...MOCK_CATS[1], lat: 25.360560342816825, lon: 51.5663946035289 },
        { ...MOCK_CATS[2], lat: 25.358961658893847, lon: 51.568901539486866 }
    ];

    for (const cat of specificCats) {
        // We omit the ID to let Supabase generate a new one, or we could handle it.
        // MOCK_CATS has string IDs, DB expects bigint or we ignore it.
        await addCat(cat.name, cat.description, cat.image, cat.lat, cat.lon);
    }
};
