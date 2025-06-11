-- Add currency column to artworks table
-- This migration adds a currency field to store the currency code for each artwork

-- Check if currency column already exists before adding it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artworks' 
    AND column_name = 'currency'
  ) THEN
    -- Add the currency column with default value 'GBP'
    ALTER TABLE public.artworks 
    ADD COLUMN currency text DEFAULT 'GBP';
    
    -- Add a constraint to ensure only valid currency codes are allowed
    ALTER TABLE public.artworks 
    ADD CONSTRAINT valid_currency_code 
    CHECK (currency IN ('GBP', 'USD', 'EUR', 'JPY'));
    
    RAISE NOTICE 'Added currency column to artworks table with GBP default';
  ELSE
    RAISE NOTICE 'Currency column already exists in artworks table';
  END IF;
END $$;

-- Update existing records to have GBP as default currency if they don't have one
UPDATE public.artworks 
SET currency = 'GBP' 
WHERE currency IS NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.artworks.currency IS 'Currency code for the artwork price (GBP, USD, EUR, JPY)'; 