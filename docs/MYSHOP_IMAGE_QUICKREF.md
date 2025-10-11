# 📸 MyShop Tools - Image Feature Quick Reference

## 🚀 Quick Commands

### Deploy Updates
```powershell
.\deploy-image-feature.ps1
```

### Test API
```powershell
node test_image_api.js
```

### Restart Backend
```powershell
pm2 restart secretapp-backend
```

### View Logs
```powershell
pm2 logs secretapp-backend
```

### Database Setup
```powershell
Get-Content "create_myshop_images_table.sql" | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u secretapp -p"YourSecurePassword123!"
```

---

## 🎯 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/inventory/:id/images` | Get all images for item |
| POST | `/api/inventory/:id/images` | Upload new image |
| GET | `/api/inventory/images/:imageId` | Get single image |
| DELETE | `/api/inventory/images/:imageId` | Delete image |

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `server.js` | Backend API with image endpoints |
| `src/MyShopTools.tsx` | Frontend UI with image components |
| `create_myshop_images_table.sql` | Database schema |
| `test_image_api.js` | API test script |
| `deploy-image-feature.ps1` | Deployment automation |

---

## 🗄️ Database Schema

```sql
CREATE TABLE myshop_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inventory_id INT NOT NULL,
  image_name VARCHAR(255) NOT NULL,
  image_data LONGBLOB NOT NULL,
  image_type VARCHAR(100) NOT NULL,
  image_size INT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inventory_id) REFERENCES myshop_inventory(id) ON DELETE CASCADE
);
```

---

## 🎨 User Actions

| Action | Steps |
|--------|-------|
| **Upload** | Edit → Add Images → Select Files → Save |
| **View** | Select Item → Scroll to Images → Click Thumbnail |
| **Delete** | Edit → Click Image to Mark → Save |

---

## ✅ Implementation Checklist

- [x] Database table created
- [x] API endpoints added
- [x] Frontend UI implemented
- [x] Backend deployed
- [x] Frontend built & deployed
- [x] Tests passed
- [x] Documentation complete

---

## 🌐 URLs

- **Frontend**: http://localhost or your domain
- **Backend**: http://localhost:3001/api
- **Test**: http://localhost:3001/api/test

---

## 📚 Documentation

1. **Technical Guide**: `docs/MYSHOP_IMAGE_FEATURE.md`
2. **User Guide**: `docs/MYSHOP_IMAGE_USER_GUIDE.md`
3. **Summary**: `docs/MYSHOP_IMAGE_COMPLETE.md`
4. **This File**: `docs/MYSHOP_IMAGE_QUICKREF.md`

---

## 🐛 Troubleshooting

```powershell
# Check if backend is running
pm2 status

# View backend logs
pm2 logs secretapp-backend --lines 50

# Test database connection
curl http://localhost:3001/api/test

# Test image endpoints
node test_image_api.js

# Restart everything
pm2 restart secretapp-backend
```

---

## 💾 Backup

Images are stored in MySQL. To backup:
```powershell
mysqldump -u secretapp -p"YourSecurePassword123!" woodworking_projects myshop_images > myshop_images_backup.sql
```

---

## 🎓 Code Snippets

### Upload Image (API)
```javascript
const response = await fetch(`/api/inventory/${id}/images`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageName: file.name,
    imageData: base64String,
    imageType: file.type
  })
})
```

### Display Image
```html
<img src={`${apiBaseUrl}/inventory/images/${imageId}`} />
```

---

**Last Updated**: October 11, 2025
