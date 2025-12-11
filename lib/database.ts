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

import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';

export const updateCat = async (id: number, updates: { latitude?: number; longitude?: number; lastFed?: string; lastSighted?: string; status?: string; rescueFlags?: string[]; locationDescription?: string; colorProfile?: string[]; tnrStatus?: boolean; description?: string; image?: string }) => {
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
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.image) dbUpdates.image = updates.image;

    const { error } = await supabase
        .from('cats')
        .update(dbUpdates)
        .eq('id', id);

    if (error) console.error('Error updating cat:', error);
};

export const uploadCatImage = async (uri: string): Promise<string | null> => {
    try {
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
        const filePath = `cat_${Date.now()}.jpg`;
        const contentType = 'image/jpeg';

        const { data, error } = await supabase.storage
            .from('cat-photos')
            .upload(filePath, decode(base64), { contentType });

        if (error) {
            console.error('Upload Error:', error);
            return null;
        }

        const { data: publicData } = supabase.storage.from('cat-photos').getPublicUrl(filePath);
        return publicData.publicUrl;
    } catch (e) {
        console.error('FileSystem Error:', e);
        return null;
    }
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
    // 1. Add feeding record
    const { error } = await supabase
        .from('cat_feedings')
        .insert({
            cat_id: catId,
            food_type: foodType,
            amount: amount,
            shared_with_others: shared
        });

    if (error) {
        console.error('Error adding feeding:', error);
        return;
    }

    // 2. Update cat's last_fed timestamp
    const { error: updateError } = await supabase
        .from('cats')
        .update({ last_fed: new Date().toISOString() })
        .eq('id', catId);

    if (updateError) console.error('Error updating cat last_fed:', updateError);
};

export const seedDatabase = async () => {
    console.log('Resetting and Seeding Supabase...');

    // 1. We keep existing data but update it to match our mock data (UPSERT)
    // This prevents "Key not present" errors if the UI is holding onto an ID that gets deleted.
    // We do NOT delete everything first anymore.

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

    // Try inserting with all fields first
    const fullPayload = specificCats.map((cat) => {
        const basePayload: any = {
            id: parseInt(cat.id), // CRITICAL: Use stable IDs from MockData
            name: cat.name,
            breed: cat.breed || 'Unknown',
            status: cat.status,
            description: cat.description,
            image: cat.image,
            latitude: cat.lat,
            longitude: cat.lon,
            last_fed: cat.lastFed ? cat.lastFed.toISOString() : null,
            last_sighted: parseRelativeToISO(cat.lastSighted),
            tnr_status: cat.tnrStatus ?? false,
        };

        // Include optional columns if they exist
        if (cat.locationDescription !== undefined) {
            basePayload.location_description = cat.locationDescription;
        }
        if (cat.rescueFlags !== undefined) {
            basePayload.rescue_flags = cat.rescueFlags;
        }
        if (cat.colorProfile !== undefined) {
            basePayload.color_profile = cat.colorProfile;
        }

        return basePayload;
    });

    // UPSERT instead of INSERT
    let { error: insertError } = await supabase.from('cats').upsert(fullPayload);

    // If insert failed due to missing columns, retry with only basic fields
    if (insertError && (insertError.message?.includes('color_profile') || insertError.message?.includes('rescue_flags') || insertError.message?.includes('location_description') || insertError.message?.includes('tnr_status'))) {
        console.warn('⚠️  Some database columns are missing. Inserting with basic fields only. Run add_missing_columns.sql in Supabase SQL editor to enable all features.');

        // Retry with only basic fields that should always exist
        const basicPayload = specificCats.map((cat) => ({
            id: parseInt(cat.id), // CRITICAL: Use stable IDs
            name: cat.name,
            breed: cat.breed || 'Unknown',
            status: cat.status,
            description: cat.description,
            image: cat.image,
            latitude: cat.lat,
            longitude: cat.lon,
            last_fed: cat.lastFed ? cat.lastFed.toISOString() : null,
            last_sighted: parseRelativeToISO(cat.lastSighted),
        }));

        const { error: basicError } = await supabase.from('cats').upsert(basicPayload);
        if (basicError) {
            console.error('Error upserting cats (basic fields):', basicError);
        } else {
            console.log('✓ Successfully upserted cats with basic fields');
        }
    } else if (insertError) {
        console.error('Error upserting cats:', insertError);
    } else {
        console.log('✓ Successfully upserted cats with all fields');
    }
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
