import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lzpnsbhxbjbofpvcrtqz.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_BtMIVGaycGdK0RjP3rgxtA_hjbujhu1';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
