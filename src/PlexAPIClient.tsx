/**
 * PlexAPIClient.tsx - Bruno-like API Client for Plex Server
 * 
 * WHAT THIS COMPONENT DOES:
 * This creates a Bruno-style API testing interface specifically for your Plex server:
 * 1. 🎯 LEFT SIDE: API endpoint selection (sections, playlists, collections, etc.)
 * 2. 📊 RIGHT SIDE: JSON response display with syntax highlighting
 * 3. 🔧 BUILT-IN CONFIG: Hardcoded Plex URL and token (no user input needed)
 * 4. 🎨 MUI DESIGN: Consistent with your other app components
 * 
 * LEARNING CONCEPTS:
 * - Two-panel layout design
 * - API endpoint organization
 * - JSON syntax highlighting
 * - Error handling and loading states
 * - Copy to clipboard functionality
 */

import React, { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Collapse,
  TextField,
  Card,
  CardContent,
  Tooltip
} from '@mui/material'
import {
  VideoLibrary as LibraryIcon,
  Search as SearchIcon,
  Collections as CollectionsIcon,
  QueueMusic as PlaylistIcon,
  Info as MetadataIcon,
  PlayArrow as PlayIcon,
  ContentCopy as CopyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Folder as FolderIcon,
  Movie as MovieIcon,
  Tv as TvIcon,
  Info as InfoIcon
} from '@mui/icons-material'

// Types for our API client
interface APIEndpoint {
  id: string
  label: string
  icon: React.ReactNode
  category: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
  requiresInput?: boolean
  inputPlaceholder?: string
  children?: APIEndpoint[]
}

interface APIResponse {
  data: any
  status: number
  statusText: string
  headers: Record<string, string>
  url: string
  timestamp: Date
}

// Note: Plex configuration is handled by the backend server for security

// API Endpoints organized by category
const API_ENDPOINTS: APIEndpoint[] = [
  {
    id: 'library',
    label: 'Library Information',
    icon: <LibraryIcon />,
    category: 'Library',
    method: 'GET',
    path: '/library/sections',
    description: 'Get all library sections (movies, TV shows, music, etc.)',
    children: [
      {
        id: 'library-stats',
        label: 'Library Statistics',
        icon: <InfoIcon />,
        category: 'Library',
        method: 'GET',
        path: '/plex/stats',
        description: 'Get statistics for all libraries with counts and basic info'
      },
      {
        id: 'sections',
        label: 'All Sections',
        icon: <FolderIcon />,
        category: 'Library',
        method: 'GET',
        path: '/library/sections',
        description: 'List all library sections with their types and counts'
      },
      {
        id: 'section-content',
        label: 'Section Content',
        icon: <MovieIcon />,
        category: 'Library',
        method: 'GET',
        path: '/library/sections/{key}/all',
        description: 'Get all content from a specific library section',
        requiresInput: true,
        inputPlaceholder: 'Enter section key (e.g., 9)'
      },
      {
        id: 'recently-added',
        label: 'Recently Added',
        icon: <PlayIcon />,
        category: 'Library',
        method: 'GET',
        path: '/library/recentlyAdded',
        description: 'Get recently added content across all libraries'
      }
    ]
  },
  {
    id: 'search',
    label: 'Search & Discovery',
    icon: <SearchIcon />,
    category: 'Search',
    method: 'GET',
    path: '/search',
    description: 'Search across all libraries for specific content',
    children: [
      {
        id: 'search-all',
        label: 'Search All',
        icon: <SearchIcon />,
        category: 'Search',
        method: 'GET',
        path: '/search',
        description: 'Search for movies, shows, music, etc.',
        requiresInput: true,
        inputPlaceholder: 'Enter search term (e.g., "Marvel")'
      },
      {
        id: 'search-movies',
        label: 'Search Movies Only',
        icon: <MovieIcon />,
        category: 'Search',
        method: 'GET',
        path: '/search?type=1',
        description: 'Search specifically for movies',
        requiresInput: true,
        inputPlaceholder: 'Enter movie title'
      },
      {
        id: 'search-shows',
        label: 'Search TV Shows Only',
        icon: <TvIcon />,
        category: 'Search',
        method: 'GET',
        path: '/search?type=2',
        description: 'Search specifically for TV shows',
        requiresInput: true,
        inputPlaceholder: 'Enter show title'
      }
    ]
  },
  {
    id: 'collections',
    label: 'Collections',
    icon: <CollectionsIcon />,
    category: 'Collections',
    method: 'GET',
    path: '/library/collections',
    description: 'Manage and view movie/show collections',
    children: [
      {
        id: 'all-collections',
        label: 'All Collections',
        icon: <CollectionsIcon />,
        category: 'Collections',
        method: 'GET',
        path: '/library/collections',
        description: 'List all collections in your library'
      },
      {
        id: 'collection-items',
        label: 'Collection Items',
        icon: <FolderIcon />,
        category: 'Collections',
        method: 'GET',
        path: '/library/collections/{key}/children',
        description: 'Get items within a specific collection',
        requiresInput: true,
        inputPlaceholder: 'Enter collection key'
      }
    ]
  },
  {
    id: 'playlists',
    label: 'Playlists',
    icon: <PlaylistIcon />,
    category: 'Playlists',
    method: 'GET',
    path: '/playlists',
    description: 'Manage and view playlists',
    children: [
      {
        id: 'all-playlists',
        label: 'All Playlists',
        icon: <PlaylistIcon />,
        category: 'Playlists',
        method: 'GET',
        path: '/playlists',
        description: 'List all playlists on the server'
      },
      {
        id: 'playlist-items',
        label: 'Playlist Items',
        icon: <PlayIcon />,
        category: 'Playlists',
        method: 'GET',
        path: '/playlists/{key}/items',
        description: 'Get items within a specific playlist',
        requiresInput: true,
        inputPlaceholder: 'Enter playlist key'
      }
    ]
  },
  {
    id: 'metadata',
    label: 'Metadata & Details',
    icon: <MetadataIcon />,
    category: 'Metadata',
    method: 'GET',
    path: '/library/metadata/{key}',
    description: 'Get detailed metadata for specific items',
    children: [
      {
        id: 'item-metadata',
        label: 'Item Metadata',
        icon: <InfoIcon />,
        category: 'Metadata',
        method: 'GET',
        path: '/library/metadata/{key}',
        description: 'Get complete metadata for a specific movie/show/episode',
        requiresInput: true,
        inputPlaceholder: 'Enter item key/rating key'
      },
      {
        id: 'item-children',
        label: 'Item Children',
        icon: <FolderIcon />,
        category: 'Metadata',
        method: 'GET',
        path: '/library/metadata/{key}/children',
        description: 'Get children of an item (e.g., episodes of a TV show)',
        requiresInput: true,
        inputPlaceholder: 'Enter parent item key'
      }
    ]
  }
]

export default function PlexAPIClient() {
  // State management
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null)
  const [response, setResponse] = useState<APIResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Library']))
  const [inputValue, setInputValue] = useState('')

  // Handle endpoint selection
  const handleEndpointSelect = (endpoint: APIEndpoint) => {
    setSelectedEndpoint(endpoint)
    setResponse(null)
    setError(null)
    setInputValue('')
  }

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  // Get the API base URL
  const getApiBaseUrl = () => {
    const configuredBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
    if (configuredBase) {
      return configuredBase
    }
    const devBase = 'http://localhost:3001/api'
    const prodBase = `${window.location.origin}/api`
    return import.meta.env.DEV ? devBase : prodBase
  }

  // Execute API call through our backend
  const executeRequest = async () => {
    if (!selectedEndpoint) return

    setLoading(true)
    setError(null)

    try {
      const apiBaseUrl = getApiBaseUrl()
      let backendPath = ''
      
      // Map Plex API paths to our backend endpoints
      switch (selectedEndpoint.id) {
        case 'library-stats':
          backendPath = '/plex/stats'
          break
        case 'sections':
          backendPath = '/plex/sections'
          break
        case 'section-content':
          if (!inputValue) {
            throw new Error('Section key is required')
          }
          backendPath = `/plex/sections/${inputValue}/all`
          break
        case 'search-all':
        case 'search-movies':
        case 'search-shows':
          if (!inputValue) {
            throw new Error('Search term is required')
          }
          backendPath = `/plex/search?query=${encodeURIComponent(inputValue)}`
          if (selectedEndpoint.id === 'search-movies') {
            backendPath += '&type=movie'
          }
          break
        case 'all-collections':
          backendPath = '/plex/collections'
          break
        case 'collection-items':
          if (!inputValue) {
            throw new Error('Collection key is required')
          }
          backendPath = `/plex/collections/${inputValue}`
          break
        case 'all-playlists':
          backendPath = '/plex/playlists'
          break
        case 'playlist-items':
          if (!inputValue) {
            throw new Error('Playlist key is required')
          }
          backendPath = `/plex/playlists/${inputValue}/items`
          break
        case 'item-metadata':
          if (!inputValue) {
            throw new Error('Item key is required')
          }
          backendPath = `/plex/metadata/${inputValue}`
          break
        case 'recently-added':
          backendPath = '/plex/library'
          break
        default:
          backendPath = '/plex/stats' // Default to stats
      }

      const fullUrl = `${apiBaseUrl}${backendPath}`
      console.log('Executing request to backend:', fullUrl)

      // Make the request to our backend
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      // Parse response
      const data = await response.json()
      
      // Create response object
      const apiResponse: APIResponse = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: fullUrl,
        timestamp: new Date()
      }

      setResponse(apiResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Copy response to clipboard
  const copyToClipboard = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response.data, null, 2))
    }
  }

  // Render endpoint tree
  const renderEndpoints = (endpoints: APIEndpoint[], level = 0) => {
    const groupedEndpoints = endpoints.reduce((acc, endpoint) => {
      if (!acc[endpoint.category]) {
        acc[endpoint.category] = []
      }
      acc[endpoint.category].push(endpoint)
      return acc
    }, {} as Record<string, APIEndpoint[]>)

    return Object.entries(groupedEndpoints).map(([category, categoryEndpoints]) => (
      <Box key={category}>
        {level === 0 && (
          <ListItem disablePadding>
            <ListItemButton onClick={() => toggleCategory(category)}>
              <ListItemIcon>
                {categoryEndpoints[0].icon}
              </ListItemIcon>
              <ListItemText primary={category} />
              {expandedCategories.has(category) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
          </ListItem>
        )}
        
        <Collapse in={expandedCategories.has(category)} timeout="auto" unmountOnExit>
          {categoryEndpoints.map((endpoint) => (
            <Box key={endpoint.id}>
              <ListItem disablePadding sx={{ pl: level * 2 }}>
                <ListItemButton
                  selected={selectedEndpoint?.id === endpoint.id}
                  onClick={() => handleEndpointSelect(endpoint)}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {endpoint.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={endpoint.label}
                    secondary={endpoint.description}
                  />
                  <Chip 
                    label={endpoint.method} 
                    size="small" 
                    color={endpoint.method === 'GET' ? 'primary' : 'secondary'}
                  />
                </ListItemButton>
              </ListItem>
              
              {endpoint.children && expandedCategories.has(category) && (
                <Box sx={{ pl: 2 }}>
                  {endpoint.children.map((child) => (
                    <ListItem key={child.id} disablePadding sx={{ pl: 2 }}>
                      <ListItemButton
                        selected={selectedEndpoint?.id === child.id}
                        onClick={() => handleEndpointSelect(child)}
                      >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {child.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={child.label}
                          secondary={child.description}
                        />
                        <Chip 
                          label={child.method} 
                          size="small" 
                          color={child.method === 'GET' ? 'primary' : 'secondary'}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Collapse>
      </Box>
    ))
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex' }}>
      {/* Left Side - API Endpoint Selection */}
      <Paper 
        elevation={3} 
        sx={{ 
          width: 400, 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: 0
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: '1px solid #ddd' }}>
          <Typography variant="h5" gutterBottom>
            🎬 Plex API Client
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bruno-style API testing for your Plex server
          </Typography>
          
          {/* Quick Test Buttons */}
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                const statsEndpoint = API_ENDPOINTS[0].children?.find(child => child.id === 'library-stats')
                if (statsEndpoint) {
                  setSelectedEndpoint(statsEndpoint)
                  setResponse(null)
                  setError(null)
                  setInputValue('')
                  // Auto-execute after a brief delay to let state update
                  setTimeout(async () => {
                    setLoading(true)
                    setError(null)
                    
                    try {
                      const apiBaseUrl = getApiBaseUrl()
                      const response = await fetch(`${apiBaseUrl}/plex/stats`)
                      const data = await response.json()
                      
                      setResponse({
                        data,
                        status: response.status,
                        statusText: response.statusText,
                        headers: Object.fromEntries(response.headers.entries()),
                        url: `${apiBaseUrl}/plex/stats`,
                        timestamp: new Date()
                      })
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'An error occurred')
                    } finally {
                      setLoading(false)
                    }
                  }, 100)
                }
              }}
            >
              Quick Test
            </Button>
            <Chip 
              label="🔗 Backend Proxy" 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          </Box>
        </Box>

        {/* Endpoint List */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <List dense>
            {renderEndpoints(API_ENDPOINTS)}
          </List>
        </Box>

        {/* Request Configuration */}
        {selectedEndpoint && (
          <Box sx={{ p: 2, borderTop: '1px solid #ddd' }}>
            <Typography variant="subtitle2" gutterBottom>
              Request Configuration
            </Typography>
            
            {selectedEndpoint.requiresInput && (
              <TextField
                fullWidth
                size="small"
                label="Input Parameter"
                placeholder={selectedEndpoint.inputPlaceholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                sx={{ mb: 2 }}
              />
            )}

            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={executeRequest}
              disabled={loading || (selectedEndpoint.requiresInput && !inputValue)}
              fullWidth
            >
              {loading ? <CircularProgress size={20} /> : 'Execute Request'}
            </Button>
          </Box>
        )}
      </Paper>

      {/* Right Side - Response Display */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Response Header */}
        <Paper 
          elevation={1} 
          sx={{ 
            p: 2, 
            borderBottom: '1px solid #ddd',
            borderRadius: 0
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {selectedEndpoint ? `${selectedEndpoint.method} ${selectedEndpoint.path}` : 'Select an endpoint'}
            </Typography>
            
            {response && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip 
                  label={`${response.status} ${response.statusText}`}
                  color={response.status < 300 ? 'success' : 'error'}
                  size="small"
                />
                <Tooltip title="Copy response to clipboard">
                  <IconButton onClick={copyToClipboard} size="small">
                    <CopyIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Response Content */}
        <Box sx={{ flexGrow: 1, p: 2, overflow: 'auto' }}>
          {!selectedEndpoint && (
            <Alert severity="info">
              Select an API endpoint from the left panel to begin testing your Plex server.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {response && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Response Info */}
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Response Information
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> {response.status} {response.statusText}<br />
                    <strong>Time:</strong> {response.timestamp.toLocaleTimeString()}<br />
                    <strong>URL:</strong> {response.url}
                  </Typography>
                </CardContent>
              </Card>

              {/* JSON Response */}
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    JSON Response
                  </Typography>
                  <Box 
                    component="pre" 
                    sx={{ 
                      backgroundColor: '#f5f5f5',
                      p: 2,
                      borderRadius: 1,
                      overflow: 'auto',
                      maxHeight: '60vh',
                      fontSize: '0.875rem',
                      fontFamily: 'monospace'
                    }}
                  >
                    {JSON.stringify(response.data, null, 2)}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}