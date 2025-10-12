import { useState, useEffect, useMemo, useCallback } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Box, Typography, Chip, Button, TextField, InputAdornment } from '@mui/material'
import { Movie as MovieIcon, Shuffle, Search } from '@mui/icons-material'
import './App.css'

interface PlexMedia {
  id: number
  duration: number
  bitrate: number
  width: number
  height: number
  aspectRatio: number
  audioChannels: number
  audioCodec: string
  videoCodec: string
  videoResolution: string
  container: string
  videoFrameRate: string
}

interface PlexImage {
  alt: string
  type: string
  url: string
}

interface PlexGenre {
  tag: string
}

interface PlexPerson {
  tag: string
}

interface PlexMovie {
  ratingKey: string
  key: string
  guid: string
  slug?: string
  studio?: string
  type: string
  title: string
  contentRating?: string
  summary: string
  rating?: number
  audienceRating?: number
  viewCount?: number
  lastViewedAt?: number
  year: number
  tagline?: string
  thumb: string
  art: string
  duration: number
  originallyAvailableAt: string
  addedAt: number
  updatedAt: number
  Media?: PlexMedia[]
  Image?: PlexImage[]
  Genre?: PlexGenre[]
  Country?: PlexPerson[]
  Director?: PlexPerson[]
  Writer?: PlexPerson[]
  Role?: PlexPerson[]
}

interface PlexResponse {
  MediaContainer: {
    size: number
    librarySectionTitle: string
    Metadata: PlexMovie[]
  }
}

export default function HalloweenMovieSelector() {
  const [movies, setMovies] = useState<PlexMovie[]>([])
  const [selectedMovie, setSelectedMovie] = useState<PlexMovie | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showMobileDetails, setShowMobileDetails] = useState(false)

  const apiBaseUrl = useMemo(() => {
    const configuredBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
    if (configuredBase) {
      return configuredBase
    }
    const devBase = 'http://localhost:3001/api'
    const prodBase = `${window.location.origin}/api`
    return import.meta.env.DEV ? devBase : prodBase
  }, [])

  const plexLibraryEndpoint = `${apiBaseUrl}/plex/library`

  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(plexLibraryEndpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: PlexResponse = await response.json()
      setMovies(data.MediaContainer.Metadata || [])
      
      if (data.MediaContainer.Metadata && data.MediaContainer.Metadata.length > 0) {
        setSelectedMovie(data.MediaContainer.Metadata[0])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch movies')
      console.error('Error fetching movies:', err)
    } finally {
      setLoading(false)
    }
  }, [plexLibraryEndpoint])

  useEffect(() => {
    fetchMovies()
  }, [fetchMovies])

  const pickRandomMovie = () => {
    if (filteredMovies.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredMovies.length)
      setSelectedMovie(filteredMovies[randomIndex])
      setShowMobileDetails(true)
    }
  }

  const formatDuration = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / 3600000)
    const minutes = Math.floor((milliseconds % 3600000) / 60000)
    return `${hours}h ${minutes}m`
  }

  const getImageUrl = (path?: string) => {
    if (!path) return ''
    const encodedPath = encodeURIComponent(path)
    return `${apiBaseUrl}/plex/image?path=${encodedPath}`
  }

  const filteredMovies = movies.filter(movie =>
    movie.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movie.year?.toString().includes(searchTerm) ||
    movie.Genre?.some(g => g.tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="shop-tools-container">
      {/* Header */}
      <Box sx={{ p: { xs: 1, sm: 2 }, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          mb: { xs: 1, sm: 2 },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 0 }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MovieIcon color="primary" />
            <Typography 
              variant="h5" 
              component="h1" 
              sx={{ 
                fontWeight: 'bold', 
                color: 'text.primary',
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}
            >
              Halloween Movie Selector
            </Typography>
          </Box>
          <Chip
            icon={<MovieIcon />}
            label={loading ? 'Loading...' : `${filteredMovies.length} movies`}
            color="primary"
            variant="outlined"
            size="small"
          />
        </Box>
      </Box>

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Halloween Movies...</p>
        </div>
      )}

      {error && (
        <div className="error-container">
          <h2>Error Loading Movies</h2>
          <p>{error}</p>
          <button onClick={fetchMovies} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="shop-content">
          {/* Left Side - Movie List */}
          <div className="tools-list-panel">
            <div className="search-section">
              <Button
                variant="contained"
                startIcon={<Shuffle />}
                onClick={pickRandomMovie}
                fullWidth
                size="large"
                sx={{
                  borderRadius: 2,
                  py: { xs: 1.25, sm: 1.5 },
                  textTransform: 'none',
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #9C27B0 30%, #E91E63 90%)',
                  boxShadow: '0 3px 5px 2px rgba(156, 39, 176, .3)',
                  minHeight: { xs: '48px', sm: '56px' }, // Touch-friendly height
                  '&:hover': {
                    background: 'linear-gradient(45deg, #7B1FA2 30%, #C2185B 90%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 10px 2px rgba(156, 39, 176, .3)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Pick Random Movie
              </Button>
            </div>

            <div className="search-section" style={{ paddingTop: '0.5rem' }}>
              <TextField
                fullWidth
                placeholder="Search movies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
                size="medium"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'background.default',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'background.paper',
                    },
                  },
                }}
              />
            </div>

            <div className="tools-list">
              {filteredMovies.map((movie) => (
                <div
                  key={movie.ratingKey}
                  onClick={() => {
                    setSelectedMovie(movie)
                    setShowMobileDetails(true)
                  }}
                  className={`tool-item ${selectedMovie?.ratingKey === movie.ratingKey ? 'selected' : ''}`}
                >
                  <div className="tool-name">{movie.title}</div>
                  <div className="tool-meta">
                    <span className="tool-company">{movie.year}</span>
                    {movie.rating && (
                      <span className="tool-price">⭐ {movie.rating.toFixed(1)}</span>
                    )}
                  </div>
                  {movie.Genre && movie.Genre.length > 0 && (
                    <div className="tool-sku">{movie.Genre.slice(0, 2).map(g => g.tag).join(', ')}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Movie Details */}
          <div className={`tool-details-panel ${showMobileDetails ? 'show-mobile' : ''}`}>
            {selectedMovie ? (
              <div className="tool-details">
                {/* Back to List Button (Mobile Only) */}
                <button
                  onClick={() => {
                    setSelectedMovie(null)
                    setShowMobileDetails(false)
                  }}
                  className="back-to-list-button mobile-only"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    marginBottom: '1rem',
                    width: '100%',
                    justifyContent: 'center',
                    fontWeight: '500'
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Movie List
                </button>

                {/* Movie Poster */}
                <div className="movie-poster-container">
                  <img
                    src={getImageUrl(selectedMovie.art)}
                    alt={selectedMovie.title}
                    className="movie-poster"
                    onError={(e) => {
                      e.currentTarget.src = getImageUrl(selectedMovie.thumb)
                    }}
                  />
                </div>

                <div className="details-header">
                  <div>
                    <h2 className="details-title">{selectedMovie.title}</h2>
                    {selectedMovie.tagline && (
                      <p className="movie-tagline">{selectedMovie.tagline}</p>
                    )}
                  </div>
                </div>

                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Year</span>
                    <span className="detail-value">{selectedMovie.year}</span>
                  </div>

                  {selectedMovie.contentRating && (
                    <div className="detail-item">
                      <span className="detail-label">Rating</span>
                      <span className="detail-value">{selectedMovie.contentRating}</span>
                    </div>
                  )}

                  <div className="detail-item">
                    <span className="detail-label">Duration</span>
                    <span className="detail-value">{formatDuration(selectedMovie.duration)}</span>
                  </div>

                  {selectedMovie.rating && (
                    <div className="detail-item">
                      <span className="detail-label">Score</span>
                      <span className="detail-value">⭐ {selectedMovie.rating.toFixed(1)}</span>
                    </div>
                  )}

                  {selectedMovie.audienceRating && (
                    <div className="detail-item">
                      <span className="detail-label">Audience</span>
                      <span className="detail-value">🍅 {selectedMovie.audienceRating.toFixed(1)}</span>
                    </div>
                  )}

                  {selectedMovie.viewCount && selectedMovie.viewCount > 0 && (
                    <div className="detail-item">
                      <span className="detail-label">Views</span>
                      <span className="detail-value">{selectedMovie.viewCount}</span>
                    </div>
                  )}
                </div>

                <div className="detail-section">
                  <h3 className="section-title">Summary</h3>
                  <p className="section-content">{selectedMovie.summary}</p>
                </div>

                {selectedMovie.Genre && selectedMovie.Genre.length > 0 && (
                  <div className="detail-section">
                    <h3 className="section-title">Genres</h3>
                    <div className="tags-container">
                      {selectedMovie.Genre.map((genre, index) => (
                        <span key={index} className="tag">{genre.tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMovie.Director && selectedMovie.Director.length > 0 && (
                  <div className="detail-section">
                    <h3 className="section-title">Director</h3>
                    <p className="section-content">
                      {selectedMovie.Director.map(d => d.tag).join(', ')}
                    </p>
                  </div>
                )}

                {selectedMovie.Writer && selectedMovie.Writer.length > 0 && (
                  <div className="detail-section">
                    <h3 className="section-title">Writers</h3>
                    <p className="section-content">
                      {selectedMovie.Writer.map(w => w.tag).join(', ')}
                    </p>
                  </div>
                )}

                {selectedMovie.Role && selectedMovie.Role.length > 0 && (
                  <div className="detail-section">
                    <h3 className="section-title">Cast</h3>
                    <p className="section-content">
                      {selectedMovie.Role.slice(0, 10).map(r => r.tag).join(', ')}
                    </p>
                  </div>
                )}

                {selectedMovie.studio && (
                  <div className="detail-section">
                    <h3 className="section-title">Studio</h3>
                    <p className="section-content">{selectedMovie.studio}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-selection">
                <MovieIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                <p>Select a movie or pick a random one!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
