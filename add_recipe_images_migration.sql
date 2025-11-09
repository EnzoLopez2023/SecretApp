-- Migration to add images JSON field to recipes table
-- This will replace the single image_url field with a JSON array of images

USE woodworking_projects;

-- Add the new images column
ALTER TABLE recipes ADD COLUMN images JSON DEFAULT NULL AFTER image_url;

-- Migrate existing image_url data to images array format
UPDATE recipes 
SET images = JSON_ARRAY(image_url) 
WHERE image_url IS NOT NULL AND image_url != '';

-- Keep image_url for backward compatibility (can be removed later if desired)
-- Or you can drop it with: ALTER TABLE recipes DROP COLUMN image_url;

SELECT 'Migration completed. Existing image URLs have been converted to images array format.' as status;
