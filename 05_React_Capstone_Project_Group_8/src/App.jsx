import React, { useState } from 'react';
import { Container, CssBaseline, ThemeProvider, createTheme, Typography, Box, IconButton, Paper } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import LocationForm from './components/LocationForm';
import MediaGallery from './components/MediaGallery';
import { searchPhotosByLocation } from './services/geoPhotoService';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // TODO 3.7 [Global Search Coordination]: Instantiate matching dynamic local state trackers here:
  // - 'photos': Tracks array results fetched from the Pexels service handler (default: empty array)
  // - 'loading': Toggles boolean state workflows during operations (default: false)
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRegionName, setSelectedRegionName] = useState('');

  // 🌿 GREEN NATURE THEME — Restored ✅
  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: isDarkMode ? '#81c784' : '#2e7d32',
        light: isDarkMode ? '#a5d6a7' : '#66bb6a',
        dark: isDarkMode ? '#66bb6a' : '#1b5e20',
      },
      secondary: {
        main: isDarkMode ? '#4db6ac' : '#00897b',
      },
      background: {
        default: isDarkMode ? '#0f1e19' : '#e8f5e9',
        paper: isDarkMode ? '#1e322a' : '#ffffff',
      },
      text: {
        primary: isDarkMode ? '#e0f2e9' : '#2f4f34',
        secondary: isDarkMode ? '#99c7a0' : '#5e8a64',
      },
    },
    shape: { borderRadius: 24 },
    typography: { fontFamily: '"Segoe UI", "Roboto", sans-serif' },
  });

  const handleSearchSubmit = async (locationName) => {
    // TODO 3.8 [Operational Async Glue Engine]: 
    // a. Shift local state property configuration 'loading' to true.
    // b. Fire the async handler function 'searchPhotosByLocation(locationName)' inside an await statement.
    // c. Capture resulting photo dataset arrays inside the local state 'photos'.
    // d. Toggle the operation state status trackers 'loading' back to false inside an executive safety wrapper execution tier.
    setLoading(true);
    try {
      const result = await searchPhotosByLocation(locationName, selectedRegionName);
      setPhotos(result);
    } catch (error) {
      console.error('Search failed:', error);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* 🌿 NATURE GRADIENT BACKGROUND — Green Theme ✅ */}
      <Box sx={{
        minHeight: '100vh',
        width: '100%',
        background: isDarkMode
          ? 'linear-gradient(180deg, #0a1f14 0%, #143324 35%, #1b5e20 70%, #2e7d32 100%)'
          : 'linear-gradient(180deg, #e8f5e9 0%, #c8e6c9 35%, #a5d6a7 70%, #81c784 100%)',
        transition: 'background 0.5s ease',
        py: 4,
      }}>
        <Container maxWidth="lg">
          {/* HEADER */}
          <Paper elevation={0} sx={{ 
            p: 5, 
            borderRadius: 6, 
            textAlign: 'center', 
            mb: 4,
            background: isDarkMode
              ? 'linear-gradient(135deg, rgba(26, 51, 45, 0.9) 0%, rgba(15, 30, 25, 0.9) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(224, 242, 241, 0.9) 100%)',
            backdropFilter: 'blur(10px)',
            border: isDarkMode ? '1px solid rgba(129,199,132,0.2)' : '1px solid rgba(46,125,50,0.1)',
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: -3 }}>
              <IconButton 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                color="inherit"
                sx={{ bgcolor: 'background.paper', boxShadow: 1 }}
              >
                {isDarkMode ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Box>
            
            <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom color="primary.main">
              PH TRAVEL SPOTS
            </Typography>
            <Typography variant="h6" component="p" gutterBottom color="text.secondary">
              Discover the beauty of the Philippines, one region at a time!
            </Typography>
            
          </Paper>

          {/* SEARCH FORM */}
          <Paper elevation={0} sx={{ 
            p: 5, 
            borderRadius: 6, 
            mb: 4,
            backdropFilter: 'blur(10px)',
            background: isDarkMode ? 'rgba(30, 50, 42, 0.85)' : 'rgba(255,255,255,0.9)',
            border: isDarkMode ? '1px solid rgba(129,199,132,0.2)' : '1px solid rgba(46,125,50,0.1)',
          }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 4 }} color="primary.main">
              📍 Choose Your Destination
            </Typography>
            
            <LocationForm onSearch={handleSearchSubmit} onRegionChange={setSelectedRegionName} />
            
            {photos.length > 0 && (
              <Box sx={{ mt: 4, p: 3, borderRadius: 4, textAlign: 'center',
                bgcolor: isDarkMode ? 'rgba(129, 199, 132, 0.15)' : 'rgba(46, 125, 50, 0.08)',
                color: 'text.primary'
              }}>
                <Typography variant="body1" fontWeight={600}>
                  ✨ Found <strong>{photos.length}</strong> beautiful spots
                </Typography>
              </Box>
            )}
          </Paper>

          {/* GALLERY */}
          {photos.length > 0 && (
            <Paper elevation={0} sx={{ 
              p: 5, 
              borderRadius: 6,
              backdropFilter: 'blur(10px)',
              background: isDarkMode ? 'rgba(30, 50, 42, 0.85)' : 'rgba(255,255,255,0.9)',
              border: isDarkMode ? '1px solid rgba(77,182,172,0.2)' : '1px solid rgba(0,137,123,0.1)',
            }}>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 4 }} color="secondary.main">
                📸 Tourist Spots Gallery
              </Typography>
              <MediaGallery photos={photos} loading={loading} />
            </Paper>
          )}
          
          {/* START MESSAGE */}
          {photos.length === 0 && !loading && (
            <Paper elevation={0} sx={{ 
              p: 8, 
              borderRadius: 6, 
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              background: isDarkMode ? 'rgba(30, 50, 42, 0.85)' : 'rgba(255,255,255,0.9)',
              border: isDarkMode ? '1px solid rgba(129,199,132,0.2)' : '1px solid rgba(46,125,50,0.1)',
            }}>
              <Typography variant="h5" sx={{ mb: 2 }} color="primary.main">
                🌿 Start Exploring
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Select a region and city above, then click Search to discover beautiful Philippine destinations!
              </Typography>
            </Paper>
          )}
          
          {/* LOADING */}
          {loading && (
            <Paper elevation={0} sx={{ 
              p: 8, 
              borderRadius: 6, 
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              background: isDarkMode ? 'rgba(30, 50, 42, 0.85)' : 'rgba(255,255,255,0.9)',
            }}>
              <Typography variant="body1" color="text.secondary">
                🔍 Searching for beautiful spots...
              </Typography>
            </Paper>
          )}
          
        </Container>
      </Box>
    </ThemeProvider>
  );
}