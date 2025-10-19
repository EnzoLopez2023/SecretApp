# Plex API Client - User Guide

## Overview

The **Plex API Client** is a Bruno-style API testing interface specifically designed for your Plex Media Server. It provides an intuitive way to explore and test various Plex API endpoints without needing to manually construct URLs or manage authentication tokens.

## Features

### 🎯 **Two-Panel Layout**
- **Left Panel**: Organized API endpoint selection with categories
- **Right Panel**: JSON response display with syntax highlighting

### 🔧 **Built-in Configuration**
- Pre-configured with your Plex server URL and authentication token
- No manual setup required - just click and test!

### 🎨 **Material-UI Design**
- Consistent with your other app components
- Responsive design that works on desktop and mobile
- Clean, intuitive interface

## How to Use

### 1. **Access the API Client**
Navigate to the Plex API Client from the main navigation sidebar.

### 2. **Select an Endpoint**
Browse the organized categories on the left:

#### **📚 Library Information**
- **Library Statistics**: Get counts and basic info for all your libraries
- **All Sections**: List all library sections (Movies, TV Shows, Music, etc.)
- **Section Content**: Get all content from a specific library (requires section key)
- **Recently Added**: View recently added content across all libraries

#### **🔍 Search & Discovery**
- **Search All**: Search across all your libraries for any content
- **Search Movies Only**: Find specific movies in your collection
- **Search TV Shows Only**: Find specific TV shows in your collection

#### **📁 Collections**
- **All Collections**: List all your movie/show collections
- **Collection Items**: View items within a specific collection

#### **🎵 Playlists**
- **All Playlists**: List all playlists on your server
- **Playlist Items**: View items within a specific playlist

#### **ℹ️ Metadata & Details**
- **Item Metadata**: Get complete metadata for specific movies/shows/episodes
- **Item Children**: Get children of an item (e.g., episodes of a TV show)

### 3. **Provide Input (if required)**
Some endpoints require additional input:
- **Section keys** for specific library content
- **Search terms** for finding content
- **Collection/Playlist IDs** for detailed views
- **Item keys** for metadata requests

### 4. **Execute the Request**
Click the **"Execute Request"** button to send the API call to your Plex server.

### 5. **View Results**
The right panel will display:
- **Response Information**: Status code, timestamp, and URL
- **JSON Response**: Complete API response with proper formatting

### 6. **Copy Results**
Use the copy button to copy the JSON response to your clipboard for further analysis or documentation.

## Example Workflows

### **Exploring Your Library**
1. Start with **Library Statistics** to see all your libraries and their counts
2. Use **All Sections** to get detailed section information
3. Pick a section key and use **Section Content** to browse that library

### **Searching for Content**
1. Use **Search All** with a broad term (e.g., "Marvel")
2. Refine with **Search Movies Only** for specific movie searches
3. Use the results to get item keys for detailed metadata

### **Managing Collections**
1. List **All Collections** to see what you have
2. Use **Collection Items** to see what's in each collection
3. Use **Item Metadata** to get detailed info about specific items

## Technical Notes

### **Security**
- All API calls go through your secure backend server
- Plex authentication tokens are handled server-side
- No sensitive information is exposed in the frontend

### **Response Format**
All responses follow this structure:
```json
{
  "data": { /* Plex API response */ },
  "status": 200,
  "statusText": "OK",
  "headers": { /* Response headers */ },
  "url": "/* API endpoint called */",
  "timestamp": "/* When the request was made */"
}
```

### **Error Handling**
- Network errors are displayed in the interface
- Invalid inputs are caught before making requests
- Server errors are shown with status codes and messages

## Tips for Best Results

1. **Start Simple**: Begin with Library Statistics to understand your server structure
2. **Use Meaningful Search Terms**: Be specific when searching for content
3. **Note the Keys**: Many endpoints require keys from previous responses
4. **Copy URLs**: The displayed URLs can help you understand the API structure
5. **Check Status Codes**: Green means success, red means there's an issue

## Integration with Other App Features

The Plex API Client works alongside your other app features:
- **Media Library**: Uses the same backend APIs for display
- **AI Assistant**: Can reference the same Plex data for intelligent responses
- **Data Analysis**: JSON responses can be used for further analysis

---

🎬 **Happy API Testing!** This tool gives you full visibility into your Plex server's API responses, just like Bruno but tailored specifically for your media server needs.