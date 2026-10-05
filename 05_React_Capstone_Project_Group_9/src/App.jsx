import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Container, CssBaseline, ThemeProvider, createTheme, Typography, Box, IconButton, Paper, Button, Chip } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import LocationForm from './components/LocationForm';
import MediaGallery from './components/MediaGallery';
import { searchPhotosByLocation } from './services/geoPhotoService';

// Popular destinations for the quick search chips (edit freely)
const QUICK_PICKS = ['Baguio City', 'Boracay', 'El Nido', 'Vigan City', 'Cebu City', 'Siargao'];

// HorizonGrid earthy palettes (change the colors here)
const palettes = {
  light: {
    page: '#f5e9d6',
    card: '#e6d5b5',
    input: '#f8f0e0',
    border: '#c9b896',
    text: '#2b1d14',
    muted: '#6b5a48',
    accent: '#8a9a5b',
    accentStrong: '#5f6d3a',
    accentText: '#2b1d14',
  },
  dark: {
    page: '#1f1a14',
    card: '#34291f',
    input: '#2a231b',
    border: '#4a3d2e',
    text: '#f3e7d3',
    muted: '#c4b49a',
    accent: '#8a9a5b',
    accentStrong: '#b5c47c',
    accentText: '#1f1a14',
  },
};

// Remember which place each photo came from (used for the card title and the Google Maps button)
const withPlace = (list, place) => (list || []).map((p) => ({ ...p, place }));

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // TODO 3.7 [Global Search Coordination]
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Extras: rotating hero background
  const [heroImages, setHeroImages] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heading, setHeading] = useState('Featured Philippine destinations');
  const [location, setLocation] = useState('');
  const resultsRef = useRef(null);

  // Book Now link: searches hotels for the chosen city
  const bookingUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
    `${location || 'Philippines'}, Philippines`
  )}`;

  const c = isDarkMode ? palettes.dark : palettes.light;

  // Dynamic Theme Creator configuration
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDarkMode ? 'dark' : 'light',
          primary: { main: c.accent, dark: c.accentStrong, contrastText: c.accentText },
          background: { default: c.page, paper: c.card },
          text: { primary: c.text, secondary: c.muted },
          divider: c.border,
        },
        typography: { fontFamily: '"Roboto", system-ui, sans-serif' },
        shape: { borderRadius: 12 },
        components: {
          MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
          MuiButton: {
            styleOverrides: {
              root: { borderRadius: 999, textTransform: 'none', fontWeight: 600 },
              contained: {
                backgroundColor: c.accent,
                color: c.accentText,
                boxShadow: 'none',
                '&:hover': { backgroundColor: c.accentStrong, color: '#fff', boxShadow: 'none' },
                // Disabled Search button stays visible instead of fading away
                '&.Mui-disabled': {
                  backgroundColor: c.accent,
                  color: c.accentText,
                  opacity: 0.45,
                },
              },
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                backgroundColor: c.input,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: c.border },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: c.accentStrong },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: c.accent },
              },
            },
          },
          MuiLink: { defaultProps: { color: c.accentStrong } },
        },
      }),
    [isDarkMode, c]
  );

  // Change the hero background every 5 seconds
  useEffect(() => {
    if (heroImages.length < 2) return;
    const timer = setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroImages]);

  // Load featured photos when the app first opens
  useEffect(() => {
    const loadFeatured = async () => {
      setLoading(true);
      try {
        const results = await searchPhotosByLocation('Philippines');
        setPhotos(withPlace(results, 'Philippines'));
        setHeroImages(results.slice(0, 6).map((p) => p.imageUrl));
      } finally {
        setLoading(false);
      }
    };
    loadFeatured();
  }, []);

  const handleSearchSubmit = async (locationName) => {
    // TODO 3.8 [Operational Async Glue Engine]
    setLoading(true);
    try {
      const results = await searchPhotosByLocation(locationName);
      setPhotos(withPlace(results, locationName));
      setHeading(`Tourist spots in ${locationName}`);
      setLocation(locationName);
      if (results.length > 0) {
        setHeroImages(results.slice(0, 6).map((p) => p.imageUrl));
        setHeroIndex(0);
      }
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error) {
      console.error(error);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ minHeight: '100vh', py: 3, mx: 'auto' }}>
        {/* Top bar: brand name (left) and Book Now (right) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ letterSpacing: 1 }}>
            HorizonGrid
          </Typography>
          <Button
            variant="contained"
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ px: 3 }}
          >
            Book Now
          </Button>
        </Box>

        <Paper
          elevation={0}
          sx={{
            position: 'relative',
            overflow: 'hidden',
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            textAlign: 'center',
            mb: 5,
            color: '#fff',
            background: 'linear-gradient(135deg, #3f5632, #62854f)',
          }}
        >
          {/* Rotating background layers (cross-fade) */}
          {heroImages.map((url, i) => (
            <Box
              key={url}
              sx={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: i === heroIndex ? 1 : 0,
                transition: 'opacity 1.5s ease-in-out',
              }}
            />
          ))}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.65))',
            }}
          />

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            {/* Theme toggle stays on the right, on a round translucent button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <IconButton
                onClick={() => setIsDarkMode(!isDarkMode)}
                aria-label="Toggle light or dark mode"
                sx={{
                  color: '#fff',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' },
                }}
              >
                {isDarkMode ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Box>

            <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom color="#f3e7d3">
              Explore the Philippines
            </Typography>
            <Typography variant="subtitle1" sx={{ mb: 4, color: 'rgba(255,255,255,0.92)' }}>
              Discover the best places to visit in the Philippines
            </Typography>

            {/* Search bar */}
            <Box
              sx={{
                bgcolor: c.page,
                color: c.text,
                borderRadius: 3,
                p: { xs: 2, md: 3 },
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                '& > form': { mb: 0 },
              }}
            >
              {/* Connect the location selection input modules */}
              <LocationForm onSearch={handleSearchSubmit} />
            </Box>

            {/* Quick search */}
            <Box sx={{ mt: 2.5, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mr: 0.5 }}>
                Quick search:
              </Typography>
              {QUICK_PICKS.map((place) => (
                <Chip
                  key={place}
                  label={place}
                  clickable
                  onClick={() => handleSearchSubmit(place)}
                  sx={{
                    color: '#fff',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    '&:hover': { bgcolor: 'rgba(138,154,91,0.75)' },
                  }}
                />
              ))}
            </Box>
          </Box>
        </Paper>

        <Typography
          ref={resultsRef}
          variant="h5"
          fontWeight="bold"
          sx={{
            mb: 2,
            scrollMarginTop: 16,
            display: 'inline-block',
            borderBottom: '3px solid',
            borderColor: 'primary.main',
            pb: 0.5,
          }}
        >
          {heading}
        </Typography>

        {/* Connect presentation display layout nodes passing state parameters downstream */}
        <MediaGallery photos={photos} loading={loading} />
      </Container>
    </ThemeProvider>
  );
}