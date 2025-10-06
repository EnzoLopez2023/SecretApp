import { useState, useEffect } from 'react'
import { Shuffle, ArrowLeft, Film } from 'lucide-react'
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

interface HalloweenMovieSelectorProps {
  onNavigateBack: () => void
}

export default function HalloweenMovieSelector({ onNavigateBack }: HalloweenMovieSelectorProps) {
  const [movies, setMovies] = useState<PlexMovie[]>([])
  const [selectedMovie, setSelectedMovie] = useState<PlexMovie | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const PLEX_URL = 'http://plex.enzolopez.net:32400/library/sections/9/all?X-Plex-Token=5kj8hCXerpUCNp5AxH5V'

  useEffect(() => {
    fetchMovies()
  }, [])

  const fetchMovies = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(PLEX_URL, {
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
  }

  const pickRandomMovie = () => {
    if (filteredMovies.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredMovies.length)
      setSelectedMovie(filteredMovies[randomIndex])
    }
  }

  const formatDuration = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / 3600000)
    const minutes = Math.floor((milliseconds % 3600000) / 60000)
    return `${hours}h ${minutes}m`
  }

  const getImageUrl = (path: string) => {
    if (path.startsWith('http')) return path
    return `http://plex.enzolopez.net:32400${path}?X-Plex-Token=5kj8hCXerpUCNp5AxH5V`
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const filteredMovies = movies.filter(movie =>
    movie.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movie.year?.toString().includes(searchTerm) ||
    movie.Genre?.some(g => g.tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="shop-tools-container">
      {/* Header */}
      <div className="shop-header">
        <button
          onClick={onNavigateBack}
          className="back-button"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Chat
        </button>
        
        <div className="header-title">
          <Film className="w-6 h-6" />
          <h1>Halloween Movie Selector</h1>
        </div>
        
        <div className="tools-count">
          {filteredMovies.length} movies
        </div>
      </div>

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
              <button
                onClick={pickRandomMovie}
                className="random-button"
              >
                <Shuffle className="w-4 h-4" />
                Pick Random Movie
              </button>
            </div>

            <div className="search-section" style={{ paddingTop: '0.5rem' }}>
              <input
                type="text"
                className="search-input"
                placeholder="Search movies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="tools-list">
              {filteredMovies.map((movie) => (
                <div
                  key={movie.ratingKey}
                  onClick={() => setSelectedMovie(movie)}
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
          <div className="tool-details-panel">
            {selectedMovie ? (
              <div className="tool-details">
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
                <Film size={64} />
                <p>Select a movie or pick a random one!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
