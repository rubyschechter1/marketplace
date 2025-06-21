-- Add password column to travelers table
ALTER TABLE travelers ADD COLUMN IF NOT EXISTS password VARCHAR(255);
EOF < /dev/null