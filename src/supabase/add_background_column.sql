ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS background_url TEXT;

COMMENT ON COLUMN public.conversations.background_url IS 'URL of the custom background image for the conversation';
