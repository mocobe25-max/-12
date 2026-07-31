CREATE TABLE IF NOT EXISTS public.agent_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id VARCHAR NOT NULL,
    device_id VARCHAR NOT NULL,
    device_name VARCHAR NOT NULL,
    activation_code VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activated_at TIMESTAMP WITH TIME ZONE
);
