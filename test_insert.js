import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('agent_devices').insert([
    {
      agent_id: '106918609',
      device_id: 'dev_test_123',
      device_name: 'test',
      activation_code: '1Vp9',
      status: 'pending'
    }
  ]);
  console.log("Insert result:", error ? error.message : "Success");
}
run();
