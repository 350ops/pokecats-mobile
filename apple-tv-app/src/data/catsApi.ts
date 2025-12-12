import { Cat } from '../types/cat';
import { mockCats } from './mockData';
import { hasSupabaseConfig, supabaseClient } from './supabaseClient';

const mapCatFromDb = (cat: any): Cat => ({
  id: Number(cat.id),
  name: cat.name,
  image: cat.image ?? undefined,
  breed: cat.breed,
  status: cat.status,
  description: cat.description,
  lastFed: cat.last_fed ? new Date(cat.last_fed) : null,
  lastSighted: cat.last_sighted ? new Date(cat.last_sighted) : null,
  tnrStatus: cat.tnr_status ?? null,
  timesFed: Array.isArray(cat.cat_feedings) ? cat.cat_feedings.length : cat.times_fed ?? null,
  rescueFlags: cat.rescue_flags ?? [],
  colorProfile: cat.color_profile ?? [],
  locationDescription: cat.location_description,
  assignedCaregiverId: cat.assigned_caregiver_id ?? null,
});

export const fetchCats = async (): Promise<Cat[]> => {
  if (!hasSupabaseConfig || !supabaseClient) {
    return mockCats;
  }

  const { data, error } = await supabaseClient
    .from('cats')
    .select('*, cat_feedings ( id )')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.warn('Falling back to mock cats because Supabase failed', error);
    return mockCats;
  }

  return data.map(mapCatFromDb);
};

export const recordFeeding = async (catId: number) => {
  if (!hasSupabaseConfig || !supabaseClient) return;
  const { error } = await supabaseClient
    .from('cat_feedings')
    .insert({ cat_id: catId, food_type: 'Quick Feed', amount: 'Snack', shared_with_others: false });

  if (!error) {
    await supabaseClient.from('cats').update({ last_fed: new Date().toISOString() }).eq('id', catId);
  } else {
    console.warn('Unable to record feeding', error);
  }
};

export const updateCatStatus = async (catId: number, status: string) => {
  if (!hasSupabaseConfig || !supabaseClient) return;
  const { error } = await supabaseClient.from('cats').update({ status }).eq('id', catId);
  if (error) console.warn('Unable to update status', error);
};

export const fetchCatById = async (catId: number): Promise<Cat | null> => {
  if (!hasSupabaseConfig || !supabaseClient) {
    return mockCats.find((cat) => cat.id === catId) ?? null;
  }

  const { data, error } = await supabaseClient
    .from('cats')
    .select('*, cat_feedings ( id )')
    .eq('id', catId)
    .single();

  if (error || !data) {
    console.warn('Unable to fetch cat by id', error);
    return null;
  }
  return mapCatFromDb(data);
};
