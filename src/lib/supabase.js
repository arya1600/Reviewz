import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnon) {
  throw new Error(
    '[Reviewz] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not set.\n' +
    'Copy .env.example to .env and add your Supabase project credentials.\n' +
    'The app cannot start without them.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnon);
