-- Add balance and currency to agents
ALTER TABLE agents ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Create admin_usdt_addresses
CREATE TABLE IF NOT EXISTS admin_usdt_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  network TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE admin_usdt_addresses DISABLE ROW LEVEL SECURITY;

-- Create agent_deposits
CREATE TABLE IF NOT EXISTS agent_deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  amount_usdt NUMERIC NOT NULL,
  tx_hash TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  amount_added NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE agent_deposits DISABLE ROW LEVEL SECURITY;

-- Create support_messages
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  sender TEXT NOT NULL, -- 'agent' or 'admin'
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE support_messages DISABLE ROW LEVEL SECURITY;
