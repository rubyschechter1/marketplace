-- Change image_url column from VARCHAR(500) to TEXT to support base64 images
ALTER TABLE items ALTER COLUMN image_url TYPE TEXT;