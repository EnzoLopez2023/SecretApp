# Quick Start Guide - Recipe Images & Notes Features

## Step 1: Run Database Migration

Open PowerShell and run:
```powershell
# Navigate to your project directory
cd C:\Source\Repo\SecretApp

# Run the migration (replace username with your MySQL username)
Get-Content add_recipe_images_migration.sql | mysql -u root -p woodworking_projects
```

Or using MySQL Workbench:
1. Open MySQL Workbench
2. Connect to your database
3. Open `add_recipe_images_migration.sql`
4. Execute the script

## Step 2: Restart Your Server

```powershell
# Stop the current server (Ctrl+C if running)
# Then restart
node server.js
```

## Step 3: Test the Features

### Testing Images:
1. Open your Recipe Manager app
2. Click the + button to add a new recipe
3. Fill in basic details
4. Scroll to "Images" section
5. Add an image URL (e.g., `https://example.com/image.jpg`) and press Enter
6. Add more images if desired
7. Save the recipe
8. Verify:
   - Image shows on the recipe card in the grid
   - Click recipe to view details
   - First image appears next to ingredients
   - Additional images at the bottom

### Testing Notes:
1. Open or create a recipe
2. Scroll to "Recipe Notes" field (below ingredients)
3. Add some notes (e.g., "Can substitute butter with coconut oil")
4. Save the recipe
5. View the recipe
6. Verify notes appear in a gray box below ingredients

### Testing AI Import with Notes:
1. Click "Import from text" button
2. Paste a recipe with notes (example below)
3. Click "Parse Recipe"
4. Verify notes are extracted into the Notes field

Example Recipe Text with Notes:
```
Chocolate Chip Cookies

Ingredients:
- 2 cups flour
- 1 cup butter
- 1 cup sugar
- 2 eggs
- 1 tsp vanilla
- 2 cups chocolate chips

Instructions:
1. Preheat oven to 375°F
2. Mix butter and sugar
3. Add eggs and vanilla
4. Mix in flour
5. Fold in chocolate chips
6. Bake for 12 minutes

Notes:
For chewier cookies, use brown sugar instead of white sugar.
Don't overbake - cookies will continue to cook on the pan.
Can freeze dough for up to 3 months.
```

## Troubleshooting

### Images not showing?
- Verify the image URL is publicly accessible
- Check browser console for CORS errors
- Make sure migration was run successfully

### Notes not saving?
- Check that database migration added the `notes` column
- Verify server.js has been restarted
- Check browser console for errors

### Database migration errors?
```powershell
# Check if column already exists
mysql -u root -p -e "DESCRIBE woodworking_projects.recipes;"

# If images column exists, skip migration
```

## Example Image URLs for Testing

Use these free image URLs for testing:
```
https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400
https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400
https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400
```

## Need Help?

Check the full documentation: `docs/RECIPE_IMAGES_NOTES_FEATURE.md`
