import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@env';
import 'react-native-url-polyfill/auto';

const supabaseUrl = SUPABASE_URL ?? '';
const supabaseAnonKey = SUPABASE_ANON_KEY ?? '';

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage as any,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
} else {
  console.warn('Supabase env missing. Falling back to mock data.');
}

export const supabaseClient = supabase;
export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
