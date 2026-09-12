import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('agents').insert([{agent_id: 'test', password_hash: 'test', full_name: 'test', status: 'active'}]);
  console.log("Insert agents result:", error ? error.message : "Success");
}
run();
