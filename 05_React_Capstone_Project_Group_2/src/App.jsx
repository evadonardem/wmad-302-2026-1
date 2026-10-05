import { useEffect, useMemo, useState } from 'react';
import { Container, CssBaseline, ThemeProvider, createTheme, Typography, Box, IconButton, Paper, Button, Stack, Chip } from '@mui/material';
import { LightMode, DarkMode, TravelExplore, Favorite, FavoriteBorder } from '@mui/icons-material';
import LocationForm from './components/LocationForm';
import MediaGallery from './components/MediaGallery';
import { searchPhotosByLocation } from './services/geoPhotoService';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return localStorage.getItem('lakbay-color-mode') === 'dark';
    } catch {
      return false;
    }
  });
  
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lakbay-favorites') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('lakbay-favorites', JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  useEffect(() => {
    localStorage.setItem('lakbay-color-mode', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const theme = useMemo(() => createTheme({
    cssVariables: true,
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: { main: '#0d766f' },
      secondary: { main: '#ef8354' },
      background: {
        default: isDarkMode ? '#101c1d' : '#f5f8f6',
        paper: isDarkMode ? '#172728' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif',
      h1: { fontWeight: 800, letterSpacing: '-0.04em' },
      h3: { fontWeight: 800, letterSpacing: '-0.035em' },
    },
    shape: { borderRadius: 16 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDarkMode ? '#101c1d' : '#f5f8f6',
            color: isDarkMode ? '#f1f7f5' : '#163331',
          },
        },
      },
    },
  }), [isDarkMode]);

  const handleSearchSubmit = async (locationName) => {
    setLocation(locationName);
    setShowFavorites(false);
    setLoading(true);
    try {
      const results = await searchPhotosByLocation(locationName);
      setPhotos(results);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (photoId) => {
    setFavoriteIds((current) => current.includes(photoId)
      ? current.filter((id) => id !== photoId)
      : [...current, photoId]);
  };

  const displayedPhotos = useMemo(
    () => showFavorites ? photos.filter((photo) => favoriteIds.includes(photo.id)) : photos,
    [showFavorites, photos, favoriteIds],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <Container maxWidth="lg" sx={{ minHeight: '100vh', py: { xs: 2, md: 5 } }}>
        <Paper
          className="hero-panel"
          elevation={0}
          sx={{
            p: { xs: 3, md: 6 },
            mb: 4,
            background: isDarkMode
              ? 'linear-gradient(135deg, rgba(23, 54, 53, 0.98), rgba(23, 39, 40, 0.98))'
              : 'linear-gradient(135deg, rgba(226, 245, 239, 0.96), rgba(255, 255, 255, 0.98))',
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 5 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <TravelExplore color="primary" />
              <Typography fontWeight={800} color="primary.main">LAKBAY PH</Typography>
            </Stack>
            <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1} sx={{ alignItems: { xs: 'flex-end', sm: 'center' } }}>
              <Button
                size="small"
                variant={showFavorites ? 'contained' : 'outlined'}
                startIcon={showFavorites ? <Favorite /> : <FavoriteBorder />}
                onClick={() => setShowFavorites((current) => !current)}
              >
                Favorites {favoriteIds.length > 0 && `(${favoriteIds.length})`}
              </Button>
              <IconButton onClick={() => setIsDarkMode((current) => !current)} aria-label="Toggle color mode">
                {isDarkMode ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Stack>
          </Box>

          <Chip label="Your next Philippine adventure starts here" color="secondary" size="small" sx={{ mb: 2, fontWeight: 700 }} />
          <Typography variant="h3" component="h1" sx={{ maxWidth: 650, mb: 2 }}>
            Find a place that feels like a story.
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 600, mb: 4 }}>
            Discover beautiful destinations across the Philippines, one city at a time.
          </Typography>

          <LocationForm onSearch={handleSearchSubmit} />
        </Paper>

        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight={800}>
            {showFavorites ? 'Saved discoveries' : location ? `Exploring ${location}` : 'Featured discoveries'}
          </Typography>
          <Typography color="text.secondary">
            {showFavorites ? 'Your handpicked places to visit next.' : 'Save the places that inspire your next trip.'}
          </Typography>
        </Box>
        <MediaGallery
          photos={displayedPhotos}
          loading={loading}
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
        />
      </Container>
    </ThemeProvider>
  );
}