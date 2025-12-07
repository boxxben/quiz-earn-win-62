-- Add VIP membership fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_vip boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS vip_expires_at timestamp with time zone DEFAULT NULL;

-- Create index for VIP expiry checks
CREATE INDEX IF NOT EXISTS idx_profiles_vip_expires ON public.profiles(vip_expires_at) WHERE is_vip = true;