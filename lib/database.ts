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
    pattern?: string | null;
    sex?: string;
    approximateAge?: string;
    tnrStatus?: boolean;
    status?: string;
    lastFed?: string;
    needsAttention?: boolean;
};

export const addSighting = async (catId: number | string) => {
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Insert into sightings log
    const { error: sightingError } = await supabase
        .from('cat_sightings')
        .insert({
            cat_id: catId,
            user_id: user?.id,
        });

    if (sightingError) {
        console.error('❌ Error adding sighting:', sightingError);
        throw sightingError;
    }

    // 2. Update cat's last_sighted timestamp
    const { error: updateError } = await supabase
        .from('cats')
        .update({ last_sighted: new Date().toISOString() })
        .eq('id', catId);

    if (updateError) {
        console.error('❌ Error updating cat last_sighted:', updateError);
    }
};

export const addCatPhoto = async (catId: number | string, publicUrl: string) => {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
        .from('cat_photos')
        .insert({
            cat_id: catId,
            url: publicUrl,
            user_id: user?.id,
        });

    if (error) {
        console.error('❌ Error adding photo record:', error);
        throw error;
    }
};

export const getCatPhotos = async (catId: number | string) => {
    const { data, error } = await supabase
        .from('cat_photos')
        .select('*')
        .eq('cat_id', catId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Error fetching photos:', error);
        return [];
    }
    return data;
};


// We no longer use expo-sqlite directly for data, but could use it for offline caching if we wanted to get fancy.
// For this migration, we are fetching directly from Supabase.

export const initDatabase = async () => {
    // No-op for Supabase as schema is managed on server
    // We can use this to check connection or seed data
    console.log('Using Supabase backend');
};

export const addCat = async (
    name: string,
    description: string,
    image: string,
    latitude: number,
    longitude: number,
    options?: {
        status?: string;
        tnrStatus?: boolean;
        colorProfile?: string[];
        primaryColor?: string;
        pattern?: string;
        sex?: string;
        approximateAge?: string;
        rescueFlags?: string[];
        lastFed?: string;
        needsAttention?: boolean;
        locationDescription?: string;
    }
) => {
    console.log('🐱 Adding cat with image:', image ? `${image.substring(0, 50)}...` : 'NO IMAGE');

    const insertData = {
        name,
        description,
        image: image || null, // Ensure we save null instead of empty string if no image
        latitude,
        longitude,
        status: options?.status ?? 'Healthy',
        breed: 'Unknown',
        last_sighted: new Date().toISOString(),
        tnr_status: options?.tnrStatus ?? false,
        color_profile: options?.colorProfile ?? [],
        primary_color: options?.primaryColor ?? null,
        pattern: options?.pattern ?? null,
        sex: options?.sex ?? 'unknown',
        approximate_age: options?.approximateAge ?? 'adult',
        rescue_flags: options?.rescueFlags ?? [],
        last_fed: options?.lastFed,
        needs_attention: options?.needsAttention ?? false,
        location_description: options?.locationDescription ?? null,
    };

    console.log('📝 Insert data (image field):', insertData.image ? 'HAS IMAGE' : 'NO IMAGE');

    const { error, data } = await supabase
        .from('cats')
        .insert(insertData)
        .select();

    if (error) {
        console.error('❌ Error adding cat:', error);
    } else {
        console.log('✅ Cat added successfully:', data);
    }
};


export const updateCat = async (id: number, updates: {
    name?: string;
    latitude?: number;
    longitude?: number;
    lastFed?: string;
    lastSighted?: string;
    status?: string;
    rescueFlags?: string[];
    locationDescription?: string;
    colorProfile?: string[];
    tnrStatus?: boolean;
    description?: string;
    image?: string;
    pattern?: string;
    sex?: string;
    age?: string;
    needsAttention?: boolean;
    photos?: string[];
}) => {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
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
    if (updates.photos) dbUpdates.photos = updates.photos;
    if (updates.pattern) dbUpdates.pattern = updates.pattern;
    if (updates.sex) dbUpdates.sex = updates.sex;
    if (updates.age) dbUpdates.approximate_age = updates.age;
    if (typeof updates.needsAttention === 'boolean') dbUpdates.needs_attention = updates.needsAttention;

    const { error } = await supabase
        .from('cats')
        .update(dbUpdates)
        .eq('id', id);

    if (error) console.error('Error updating cat:', error);
};

export const deleteCat = async (id: number): Promise<boolean> => {
    try {
        // Delete related records first (feedings, photos, sightings)
        await supabase.from('cat_feedings').delete().eq('cat_id', id);
        await supabase.from('cat_photos').delete().eq('cat_id', id);
        await supabase.from('cat_sightings').delete().eq('cat_id', id);

        // Delete the cat
        const { error } = await supabase
            .from('cats')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting cat:', error);
            return false;
        }

        console.log('🗑️ Cat deleted successfully:', id);
        return true;
    } catch (error) {
        console.error('Error deleting cat:', error);
        return false;
    }
};

export const uploadCatImage = async (uri: string): Promise<string | null> => {
    try {
        console.log('📷 Reading image from URI:', uri);

        // Handle different URI formats
        let fileUri = uri;

        // For expo-image-picker, the URI should already be a file:// URI
        // But we need to make sure it's readable
        if (!fileUri.startsWith('file://') && !fileUri.startsWith('/')) {
            console.warn('⚠️ Unexpected URI format:', fileUri);
        }

        const response = await fetch(fileUri);
        const arrayBuffer = await response.arrayBuffer();
        console.log('📦 Image buffer created, byte length:', arrayBuffer.byteLength);

        const filePath = `cat_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const contentType = 'image/jpeg';

        console.log('⬆️ Uploading to Supabase Storage, path:', filePath);
        const { data, error } = await supabase.storage
            .from('cat-photos')
            .upload(filePath, arrayBuffer, { contentType, upsert: true });

        if (error) {
            console.error('❌ Upload Error:', error);
            return null;
        }

        console.log('✅ Upload successful:', data);
        const { data: publicData } = supabase.storage.from('cat-photos').getPublicUrl(filePath);
        console.log('🔗 Public URL:', publicData.publicUrl);
        return publicData.publicUrl;
    } catch (e) {
        console.error('❌ Upload Error:', e);
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
        primaryColor: data.primary_color ?? null,
        pattern: data.pattern ?? null,
        sex: data.sex ?? 'unknown',
        approximateAge: data.approximate_age ?? null,
        needsAttention: data.needs_attention ?? false,
        photos: data.photos ?? [],
    };
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
        primaryColor: cat.primary_color ?? null,
        pattern: cat.pattern ?? null,
        sex: cat.sex ?? 'unknown',
        approximateAge: cat.approximate_age ?? null,
        needsAttention: cat.needs_attention ?? false,
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

    // Upload image to Supabase Storage if it's a local file URI
    let imageUrl = payload.photoUri ?? '';
    console.log('📸 Photo URI received:', payload.photoUri);

    if (payload.photoUri && (payload.photoUri.startsWith('file://') || payload.photoUri.startsWith('/') || payload.photoUri.startsWith('ph://'))) {
        console.log('📤 Uploading cat image to Supabase Storage...');
        const uploadedUrl = await uploadCatImage(payload.photoUri);
        if (uploadedUrl) {
            imageUrl = uploadedUrl;
            console.log('✅ Image uploaded successfully:', uploadedUrl);
        } else {
            console.warn('❌ Failed to upload image, storing without photo');
            imageUrl = '';
        }
    } else if (payload.photoUri) {
        console.log('🔗 Using existing URL as image:', payload.photoUri);
    }

    if (payload.catId) {
        await updateCat(payload.catId, {
            latitude: payload.latitude,
            longitude: payload.longitude,
            lastSighted: capturedAt,
            rescueFlags: payload.rescueFlags,
            locationDescription: payload.locationDescription,
            colorProfile: payload.colorTag ? [payload.colorTag] : undefined,
            status: payload.rescueFlags?.includes('injured') ? 'Needs Help' : undefined,
            image: imageUrl || undefined,
        });
        return payload.catId;
    }

    await addCat(
        payload.draftName ?? 'Unknown cat',
        payload.description ?? '',
        imageUrl,
        payload.latitude,
        payload.longitude,
        {
            status: payload.status ?? 'Healthy',
            tnrStatus: payload.tnrStatus,
            colorProfile: payload.colorTag ? [payload.colorTag] : [],
            primaryColor: payload.colorTag ?? undefined,
            pattern: payload.pattern ?? undefined,
            sex: payload.sex,
            approximateAge: payload.approximateAge,
            rescueFlags: payload.rescueFlags,
            lastFed: payload.lastFed,
            needsAttention: payload.needsAttention,
            locationDescription: payload.locationDescription,
        }
    );
    return null;
};
