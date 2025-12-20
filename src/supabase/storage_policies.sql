-- Enable RLS on the storage.objects table if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access to the conversation-background bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'conversation-background' );

-- Allow authenticated users to upload to the conversation-background bucket
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'conversation-background' );

-- Allow users to update their own uploads (optional, depends on your needs)
-- Ideally, you'd want to restrict this to only participants of the conversation, 
-- but checking conversation participation from storage policies can be complex.
-- For a basic implementation, enabling authenticated updates to the bucket is a starting point,
-- or relying on unique filenames to prevent overwrites.

-- ============================================
-- RLS POLICIES FOR CONVERSATIONS TABLE
-- ============================================
-- These are required for the UPDATE to background_url to work!

-- Enable RLS on conversations table
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Allow participants to SELECT their own conversations
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
TO authenticated
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Allow participants to UPDATE their own conversations (for background_url)
CREATE POLICY "Participants can update their conversations"
ON public.conversations FOR UPDATE
TO authenticated
USING (auth.uid() = user1_id OR auth.uid() = user2_id)
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);
