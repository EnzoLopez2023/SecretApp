# MyShop Tools - Image Attachment Feature

## Overview
The MyShop Tools application now supports attaching, viewing, and managing images for inventory items. Images are stored directly in the MySQL database for easy backup and portability.

## Features Implemented

### 1. **Database Structure**
- **New Table**: `myshop_images`
  - Stores images as LONGBLOB data
  - Links to inventory items via `inventory_id` foreign key
  - Automatically deletes images when inventory item is deleted (CASCADE)
  - Tracks image metadata (name, type, size, upload date)

### 2. **Backend API Endpoints**

#### Get Images for an Item
```
GET /api/inventory/:id/images
```
Returns all images associated with an inventory item.

#### Upload Image
```
POST /api/inventory/:id/images
Body: { imageName, imageData (base64), imageType }
```
Uploads a new image for an inventory item.

#### Get Single Image
```
GET /api/inventory/images/:imageId
```
Returns the raw image data for display.

#### Delete Image
```
DELETE /api/inventory/images/:imageId
```
Permanently deletes an image.

### 3. **Frontend Features**

#### View Mode
- **Image Gallery**: Displays all images in a responsive grid
- **Click to Enlarge**: Click any image to view it full-screen
- **Image Count**: Shows number of images in the section header
- **Responsive Design**: Grid adapts to screen size

#### Edit Mode
- **Current Images**: Shows existing images with click-to-mark-for-deletion
- **Visual Feedback**: Marked images show with red border and X icon
- **New Image Preview**: Shows preview of images to be uploaded
- **Multi-Upload**: Select multiple images at once
- **Remove Before Upload**: Can remove selected images before saving

#### Add Mode
- **Image Upload**: Can attach images when creating new items
- **Preview**: See selected images before saving

### 4. **User Workflow**

#### Adding Images to New Item
1. Click "Add New Tool"
2. Fill in item details
3. Click "Add Images" button
4. Select one or more image files
5. Preview appears showing selected images
6. Click "Save" to create item with images

#### Adding Images to Existing Item
1. Select an item from the list
2. Click "Edit"
3. Click "Add Images" button
4. Select image files
5. Preview shows new images to upload
6. Click "Save" to upload images

#### Viewing Images
1. Select an item from the list
2. Scroll to "Images" section in details
3. Click any thumbnail to view full-size
4. Click X or outside image to close

#### Removing Images
1. Select an item and click "Edit"
2. Click on any existing image to mark for deletion
3. Marked images show red border and X icon
4. Click again to unmark
5. Click "Save" to permanently delete marked images

## Technical Details

### Image Storage
- Images stored as binary data (LONGBLOB) in MySQL
- Base64 encoded for transfer between client/server
- Maximum file size: ~100MB per image (configurable via express.json limit)

### Supported Formats
- All standard image formats: JPG, PNG, GIF, WebP, etc.
- File type validation on client side
- MIME type stored for proper content-type headers

### Performance Considerations
- Images lazy-loaded from server when viewing
- Thumbnails generated on-the-fly by browser CSS
- Foreign key cascade ensures no orphaned images
- Indexed by inventory_id for fast queries

## Database Setup

Run this SQL script to add the images table:
```bash
Get-Content "C:\Source\Repo\SecretApp\create_myshop_images_table.sql" | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u secretapp -p"YourSecurePassword123!"
```

## Files Modified

### New Files
- `create_myshop_images_table.sql` - Database schema for images table

### Modified Files
- `server.js` - Added 4 new API endpoints for image management
- `src/MyShopTools.tsx` - Added image UI components and state management

## Usage Examples

### Upload Multiple Images
```javascript
// Frontend automatically handles this when user selects files
<input type="file" multiple accept="image/*" />
```

### View Full-Size Image
```javascript
// Click any image thumbnail in the gallery
onClick={() => setViewingImage(img.id)}
```

### Delete Images
```javascript
// Mark images for deletion in edit mode by clicking them
// Deletion happens when you click "Save"
```

## Future Enhancements (Optional)

1. **Image Compression**: Automatically compress images before upload
2. **Image Ordering**: Allow users to reorder images (primary image)
3. **Bulk Operations**: Select and delete multiple images at once
4. **External Storage**: Option to use cloud storage (Azure Blob, AWS S3)
5. **Image Editor**: Basic cropping/rotation tools
6. **Thumbnails**: Pre-generate optimized thumbnails for faster loading

## Testing Checklist

- [x] Database table created successfully
- [x] Backend API endpoints added
- [x] Frontend UI components integrated
- [ ] Test uploading single image
- [ ] Test uploading multiple images
- [ ] Test viewing full-size images
- [ ] Test deleting images
- [ ] Test with large images (>10MB)
- [ ] Test mobile responsiveness
- [ ] Test image persistence after refresh
- [ ] Test cascade delete (delete item with images)

## Notes

- Images are stored in the database, not on filesystem
- Backend server automatically restarted with PM2
- No additional dependencies required
- Compatible with existing MyShop Tools data
- Images survive database backups/restores
