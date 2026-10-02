import React, { useEffect, useRef, useState } from 'react';
import { Container, CssBaseline, ThemeProvider, createTheme, Typography, Box, IconButton, Paper } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import LocationForm from './components/LocationForm';
import MediaGallery from './components/MediaGallery';
import { searchPhotosByLocation } from './services/geoPhotoService';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // TODO 3.7 [Global Search Coordination]
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Extras: rotating hero background
  const [heroImages, setHeroImages] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heading, setHeading] = useState('Featured Philippine destinations');
  const resultsRef = useRef(null);

  // Dynamic Theme Creator configuration
  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
    },
  });

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
        setPhotos(results);
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
      setPhotos(results);
      setHeading(`Tourist spots in ${locationName}`);
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
      <Container maxWidth="lg" sx={{ minHeight: '100vh', py: 4 }}>
        <Paper
          elevation={0}
          sx={{
            position: 'relative',
            overflow: 'hidden',
            p: 4,
            borderRadius: 3,
            textAlign: 'center',
            mb: 4,
            color: '#fff',
            background: 'linear-gradient(135deg, #0077b6, #00b4d8)',
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
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <IconButton onClick={() => setIsDarkMode(!isDarkMode)} color="inherit">
                {isDarkMode ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Box>

            <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom color="#cafffe,#ff00ff">
              🇵🇭 Lakbay PH
            </Typography>
            <Typography variant="subtitle1" sx={{ mb: 4, color: 'rgba(255,255,255,0.9)' }}>
              Explore tourist spots across regions, cities, and municipalities in the Philippines\^o^/
            </Typography>

            {/* Connect the location selection input modules */}
            <Box sx={{ bgcolor: 'background.paper', color: 'text.primary', borderRadius: 2, p: 2, pb: 0 }}>
              <LocationForm onSearch={handleSearchSubmit} />
            </Box>
          </Box>
        </Paper>

        <Typography ref={resultsRef} variant="h5" fontWeight="bold" sx={{ mb: 2, scrollMarginTop: 16 }}>
          {heading}
        </Typography>

        {/* Connect presentation display layout nodes passing state parameters downstream */}
        <MediaGallery photos={photos} loading={loading} />
      </Container>
    </ThemeProvider>
  );
}