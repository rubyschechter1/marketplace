-- Add new columns with temporary defaults
ALTER TABLE travelers ADD COLUMN IF NOT EXISTS first_name VARCHAR(50);
ALTER TABLE travelers ADD COLUMN IF NOT EXISTS last_name VARCHAR(50);

-- Update existing rows to use username as first_name and 'U' as last name
UPDATE travelers 
SET first_name = COALESCE(display_name, username), 
    last_name = 'User'
WHERE first_name IS NULL OR last_name IS NULL;

-- Make columns required
ALTER TABLE travelers ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE travelers ALTER COLUMN last_name SET NOT NULL;

-- Drop old columns
ALTER TABLE travelers DROP COLUMN IF EXISTS username;
ALTER TABLE travelers DROP COLUMN IF EXISTS display_name;