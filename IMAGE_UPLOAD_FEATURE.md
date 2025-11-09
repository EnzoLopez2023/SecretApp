# Recipe Image Upload Feature - Implementation Complete

## What Changed

I've updated the Recipe Manager to support **file uploads** for images, just like the Woodworking Projects app, instead of only URL input.

## New Features

### 1. File Upload Button
- Click "Upload Images" button to select image files from your computer
- Supports multiple image selection
- Accepts common image formats (JPG, PNG, GIF, etc.)

### 2. Still Supports URL Input
- You can still add images by URL if you prefer
- Type URL and press Enter

### 3. Image Storage
- Images are stored in the database as BLOB data
- Each image gets a unique ID and URL path
- Images are automatically converted and uploaded when you save the recipe

## Setup Required

### 1. Run the New Database Migration

```powershell
# In MySQL Command Line Client (after login):
USE woodworking_projects;
SOURCE C:/Source/Repo/SecretApp/create_recipe_images_table.sql
```

Or paste this SQL directly:
```sql
USE woodworking_projects;

CREATE TABLE IF NOT EXISTS recipe_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_data LONGBLOB NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  INDEX idx_recipe_id (recipe_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. Restart Your Server

The server needs to be restarted to pick up the new API endpoints.

```powershell
# Stop current server (Ctrl+C)
# Then restart:
node server.js
```

## How to Use

### Adding Images to a Recipe:

1. **Create or edit a recipe**
2. **Scroll to "Images" section**
3. **Click "Upload Images" button**
4. **Select one or more image files** from your computer
5. **Images will appear as thumbnails** with preview
6. **Save the recipe** - images will be uploaded automatically

### Alternative - Add by URL:

1. Type or paste image URL in the text field
2. Press Enter
3. Image will be added to the list

### Managing Images:

- **First image** in the list = Main image (shown on recipe card)
- **Click X** on any thumbnail to remove it
- **Drag to reorder** (coming soon)

## What Happens Behind the Scenes

1. When you select files, they're converted to base64 temporarily
2. Thumbnails are shown immediately for preview
3. When you save the recipe:
   - Recipe data is saved first
   - Each image file is uploaded to the server
   - Server stores images in `recipe_images` table
   - Recipe is updated with image URLs like `/api/recipe-images/123`
4. When viewing recipes, images are loaded from these URLs

## API Endpoints Added

- `POST /api/recipes/:id/images` - Upload image for a recipe
- `GET /api/recipe-images/:imageId` - Retrieve image
- `DELETE /api/recipe-images/:imageId` - Delete image

## Files Modified

1. `src/RecipeManager.tsx` - Added image upload UI and logic
2. `server.js` - Added image upload API endpoints
3. `create_recipe_images_table.sql` - NEW database table

## Benefits

✅ Upload images directly from your computer
✅ No need to host images elsewhere
✅ Images stored securely in your database
✅ Same familiar workflow as Woodworking Projects
✅ Still supports URL input for convenience
✅ Multiple images per recipe
✅ Automatic thumbnail previews

## Testing

1. Create a new recipe
2. Click "Upload Images"
3. Select 2-3 images from your computer
4. Save the recipe
5. Verify images appear on the recipe card
6. Open the recipe to view all images
7. First image should be next to ingredients
8. Additional images at the bottom

Done! 🎉
