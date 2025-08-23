-- Fix critical security issue: Restrict access to contact_messages table containing customer PII
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "contact_messages_admin_policy" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages_insert_policy" ON public.contact_messages;

-- Create proper RLS policies for contact_messages table
-- Only authenticated admin users can view and manage contact messages
CREATE POLICY "contact_messages_admin_select_policy" 
ON public.contact_messages 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "contact_messages_admin_update_policy" 
ON public.contact_messages 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "contact_messages_admin_delete_policy" 
ON public.contact_messages 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Allow public users to only insert new contact messages (submit contact forms)
CREATE POLICY "contact_messages_public_insert_policy" 
ON public.contact_messages 
FOR INSERT 
WITH CHECK (true);