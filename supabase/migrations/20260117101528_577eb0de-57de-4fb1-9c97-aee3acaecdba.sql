-- Fix profiles table: Ensure only owner and admin can view profiles
-- First drop any existing SELECT policies that might be too permissive
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;

-- Create restrictive SELECT policy
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_admin(auth.uid()));

-- Fix application_usages table: Ensure only owner can view their usage
DROP POLICY IF EXISTS "Users can view their own usage" ON public.application_usages;
DROP POLICY IF EXISTS "Anyone can view application usages" ON public.application_usages;
DROP POLICY IF EXISTS "Authenticated users can view usages" ON public.application_usages;

-- Create restrictive SELECT policy (owner only, admins for support purposes)
CREATE POLICY "Users can view their own usage"
ON public.application_usages FOR SELECT
USING (auth.uid() = user_id);