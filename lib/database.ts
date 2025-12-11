import { MOCK_CATS } from '@/constants/MockData';
import { supabase } from './supabase';

export type QuickReportPayload = {
    catId?: number;
    draftName?: string;
    description?: string;
    photoUri?: string;
    latitude: number;
    longitude: number;
    locationDescription?: string;
    capturedAt?: string;
    rescueFlags?: string[];
    colorTag?: string | null;
    tnrStatus?: boolean;
};

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

export const updateCat = async (id: number, updates: { latitude?: number; longitude?: number; lastFed?: string; lastSighted?: string; status?: string; rescueFlags?: string[]; locationDescription?: string; colorProfile?: string[]; tnrStatus?: boolean }) => {
    const dbUpdates: any = {};
    if (updates.latitude) dbUpdates.latitude = updates.latitude;
    if (updates.longitude) dbUpdates.longitude = updates.longitude;
    if (updates.lastFed) dbUpdates.last_fed = updates.lastFed;
    if (updates.lastSighted) dbUpdates.last_sighted = updates.lastSighted;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.rescueFlags) dbUpdates.rescue_flags = updates.rescueFlags;
    if (updates.locationDescription) dbUpdates.location_description = updates.locationDescription;
    if (updates.colorProfile) dbUpdates.color_profile = updates.colorProfile;
    if (typeof updates.tnrStatus === 'boolean') dbUpdates.tnr_status = updates.tnrStatus;

    const { error } = await supabase
        .from('cats')
        .update(dbUpdates)
        .eq('id', id);

    if (error) console.error('Error updating cat:', error);
};

export const getCat = async (id: number) => {
    const { data, error } = await supabase
        .from('cats')
        .select('*, cat_feedings ( id )')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error getting cat:', error);
        return null;
    }

    // Map DB fields to app fields (snake_case to camelCase)
    return {
        ...data,
        lastFed: data.last_fed ? new Date(data.last_fed) : null,
        lastSighted: data.last_sighted ? new Date(data.last_sighted) : null,
        createdAt: data.created_at,
        timesFed: Array.isArray(data.cat_feedings) ? data.cat_feedings.length : 0,
        rescueFlags: data.rescue_flags ?? [],
        colorProfile: data.color_profile ?? [],
        locationDescription: data.location_description,
        tnrStatus: data.tnr_status ?? false,
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
        .select('*, cat_feedings ( id )')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error getting cats:', error);
        return [];
    }

    // Map snake_case to camelCase
    return data.map((cat: any) => ({
        ...cat,
        lastFed: cat.last_fed ? new Date(cat.last_fed) : null,
        lastSighted: cat.last_sighted ? new Date(cat.last_sighted) : null,
        createdAt: cat.created_at,
        timesFed: Array.isArray(cat.cat_feedings) ? cat.cat_feedings.length : 0,
        rescueFlags: cat.rescue_flags ?? [],
        colorProfile: cat.color_profile ?? [],
        locationDescription: cat.location_description,
        tnrStatus: cat.tnr_status ?? false,
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

    const parseRelativeToISO = (value?: string | Date) => {
        if (!value) return null;
        if (value instanceof Date) return value.toISOString();
        const normalized = value.trim().toLowerCase();
        if (normalized === 'now') return new Date().toISOString();
        const match = normalized.match(/(\d+)([mhdw])/);
        if (!match) return new Date().toISOString();
        const quantity = Number(match[1]);
        const unit = match[2];
        const unitMs: Record<string, number> = {
            m: 60_000,
            h: 3_600_000,
            d: 86_400_000,
            w: 604_800_000,
        };
        const ms = unitMs[unit] ?? 0;
        return new Date(Date.now() - quantity * ms).toISOString();
    };

    const specificCats = [
        { ...MOCK_CATS[0], lat: 25.37131849132432, lon: 51.558225818651536 },
        { ...MOCK_CATS[1], lat: 25.360560342816825, lon: 51.5663946035289 },
        { ...MOCK_CATS[2], lat: 25.358961658893847, lon: 51.568901539486866 },
        { ...MOCK_CATS[3], lat: 25.3750, lon: 51.5450 },
        { ...MOCK_CATS[4], lat: 25.3680, lon: 51.5520 },
        { ...MOCK_CATS[5], lat: 25.3620, lon: 51.5580 },
        { ...MOCK_CATS[6], lat: 25.3700, lon: 51.5600 },
        { ...MOCK_CATS[7], lat: 25.3640, lon: 51.5500 },
        { ...MOCK_CATS[8], lat: 25.3660, lon: 51.5540 },
    ];

    const payload = specificCats.map((cat, index) => ({
        name: cat.name,
        breed: cat.breed,
        status: cat.status,
        description: cat.description,
        image: cat.image,
        latitude: cat.lat,
        longitude: cat.lon,
        last_fed: cat.lastFed ? cat.lastFed.toISOString() : null,
        last_sighted: parseRelativeToISO(cat.lastSighted),
        location_description: cat.locationDescription ?? `${cat.name} was last reported near the community.`,
        rescue_flags: cat.rescueFlags ?? [],
        color_profile: cat.colorProfile ?? [],
        tnr_status: cat.tnrStatus ?? false,
    }));

    const { error: insertError } = await supabase.from('cats').insert(payload);
    if (insertError) console.error('Error inserting cats:', insertError);
};

export const submitQuickReport = async (payload: QuickReportPayload) => {
    const capturedAt = payload.capturedAt ?? new Date().toISOString();
    if (payload.catId) {
        await updateCat(payload.catId, {
            latitude: payload.latitude,
            longitude: payload.longitude,
            lastSighted: capturedAt,
            rescueFlags: payload.rescueFlags,
            locationDescription: payload.locationDescription,
            colorProfile: payload.colorTag ? [payload.colorTag] : undefined,
            status: payload.rescueFlags?.includes('injured') ? 'Needs Help' : undefined,
        });
        return payload.catId;
    }

    await addCat(
        payload.draftName ?? 'Unknown cat',
        payload.description ?? 'Quick sighting report',
        payload.photoUri ?? '',
        payload.latitude,
        payload.longitude
    );
    return null;
};
