# 📸 MyShop Tools - Image Attachment User Guide

## Quick Start

The MyShop Tools app now lets you attach pictures to your inventory items! Here's how to use it.

---

## 🆕 Adding Images to a New Item

1. Click the **"Add New Tool"** button
2. Fill in the item details (product name, price, etc.)
3. Scroll down to the **"Images"** section
4. Click the **"Add Images"** button
5. Select one or more image files from your computer
6. You'll see previews of your selected images
7. Click **"Save"** to create the item with images

---

## 📷 Adding Images to an Existing Item

1. Select an item from the list
2. Click the **"Edit"** button
3. Scroll to the **"Images"** section
4. Click **"Add Images"**
5. Choose your image files
6. Click **"Save"** to upload the images

---

## 👀 Viewing Images

1. Select any item from the list
2. Scroll down to the **"Images"** section
3. You'll see thumbnails of all attached images
4. **Click on any thumbnail** to view it full-screen
5. Click the **X** or anywhere outside the image to close

---

## 🗑️ Removing Images

1. Select an item and click **"Edit"**
2. In the **"Images"** section, you'll see "Current Images"
3. **Click on any image** you want to delete
   - The image will get a red border and an X icon
   - This marks it for deletion
4. Click the image again to unmark it (if you change your mind)
5. Click **"Save"** to permanently delete marked images

---

## 💡 Tips & Tricks

### Multiple Images
- You can select multiple images at once using Ctrl+Click (Windows) or Cmd+Click (Mac)
- Or hold Shift to select a range of files

### Before You Save
- ✅ You can remove newly selected images by clicking the X button on each preview
- ✅ Changes aren't saved until you click "Save"
- ✅ Click "Cancel" to discard all changes

### Image Management
- Images are saved in the database
- Each image shows its filename below the thumbnail
- The Images section header shows how many images are attached
- Images are automatically deleted if you delete the item

### Best Practices
- 📐 **Use clear, well-lit photos** for best results
- 📏 **Keep file sizes reasonable** (under 10MB per image)
- 🏷️ **Take multiple angles** of your items for reference
- 📱 **Photos from your phone work great**

---

## 🖼️ Supported Image Formats

- ✅ JPG / JPEG
- ✅ PNG
- ✅ GIF
- ✅ WebP
- ✅ SVG
- ✅ BMP

---

## ❓ Common Questions

### "How many images can I attach?"
As many as you want! There's no hard limit, but we recommend keeping it reasonable (5-10 per item).

### "What happens to my images if I delete an item?"
Images are automatically deleted when you delete an item. Make sure to save any important photos elsewhere first!

### "Can I rearrange the order of images?"
Not yet! Images are displayed in the order they were uploaded (newest first).

### "Where are the images stored?"
Images are stored directly in the MySQL database, so they're included in your regular database backups.

### "Can I download an image?"
Yes! Right-click on the full-size image and select "Save Image As..."

---

## 🚀 Quick Visual Guide

```
[Select Item] → [Edit] → [Add Images] → [Select Files] → [Save]
     ↓
  View Mode
     ↓
[Click Thumbnail] → [View Full Size] → [Click X to Close]
```

---

## 🐛 Troubleshooting

**Problem:** Image won't upload
- ✅ Check file size (try images under 10MB)
- ✅ Make sure it's a valid image format
- ✅ Try refreshing the page

**Problem:** Can't see full-size image
- ✅ Make sure pop-ups aren't blocked
- ✅ Try a different browser
- ✅ Check your internet connection

**Problem:** Images disappear after saving
- ✅ Refresh the page
- ✅ Check if you accidentally marked them for deletion
- ✅ Verify the backend server is running

---

## 🎉 You're All Set!

Enjoy using the new image feature to keep better track of your inventory!

**Need more help?** Check the technical documentation: `MYSHOP_IMAGE_FEATURE.md`
