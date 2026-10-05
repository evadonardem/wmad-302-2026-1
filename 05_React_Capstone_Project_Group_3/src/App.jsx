import React, { useMemo, useState } from 'react';
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  Typography,
  Box,
  IconButton,
  Chip,
  Link,
} from '@mui/material';
import {
  LightMode,
  DarkMode,
  TravelExplore,
  PhotoCamera,
} from '@mui/icons-material';
import LocationForm from './components/LocationForm';
import MediaGallery from './components/MediaGallery';
import { searchPhotosByLocation } from './services/geoPhotoService';

const CREAM = '#f8ece6';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState('');

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDarkMode ? 'dark' : 'light',
          primary: {
            main: isDarkMode ? '#e0a3b5' : '#7a1f3d',
            contrastText: isDarkMode ? '#2a1820' : '#ffffff',
          },
          secondary: { main: isDarkMode ? '#d4b073' : '#b8894a' },
          background: {
            default: isDarkMode ? '#1d1015' : '#f8f1ec',
            paper: isDarkMode ? '#2a1820' : '#fffaf6',
          },
          text: {
            primary: isDarkMode ? '#f3e6e8' : '#3a1f27',
            secondary: isDarkMode ? '#bfa3aa' : '#7a6169',
          },
          divider: isDarkMode
            ? 'rgba(243, 230, 232, 0.12)'
            : 'rgba(122, 31, 61, 0.14)',
        },
        shape: { borderRadius: 14 },
        typography: {
          fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
        },
        components: {
          MuiPaper: {
            styleOverrides: { root: { backgroundImage: 'none' } },
          },
        },
      }),
    [isDarkMode]
  );

  const handleSearchSubmit = async (locationName) => {
    setLoading(true);
    setSearchedLocation(locationName);

    try {
      const results = await searchPhotosByLocation(locationName);
      setPhotos(results);
    } catch (error) {
      console.error('Photo search failed:', error);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'minmax(340px, 400px) minmax(0, 1fr)',
          },
          gap: { xs: 1.5, md: 2.5 },
          p: { xs: 1.5, md: 2.5 },
          boxSizing: 'border-box',
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        {/* Sidebar Navigation */}
        <Box
          component="aside"
          sx={{
            position: { md: 'sticky' },
            top: 20,
            alignSelf: 'start',
            height: { md: 'calc(100vh - 40px)' },
            boxSizing: 'border-box',
            overflowY: 'auto',
            p: { xs: 3, md: 4 },
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            color: CREAM,
            borderRadius: '28px',
            boxShadow: '0 16px 40px rgba(78, 18, 40, 0.25)',
            background: isDarkMode
              ? 'linear-gradient(160deg, #4a1225 0%, #2c0b17 100%)'
              : 'linear-gradient(160deg, #7a1f3d 0%, #4e1228 100%)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'rgba(248, 236, 230, 0.14)',
                border: '1px solid rgba(248, 236, 230, 0.3)',
              }}
            >
              <TravelExplore fontSize="small" />
            </Box>

            <IconButton
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="Toggle dark mode"
              sx={{
                color: CREAM,
                border: '1px solid rgba(248, 236, 230, 0.3)',
              }}
            >
              {isDarkMode ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Box>

          <Box sx={{ my: 'auto' }}>
            <Typography
              component="h1"
              sx={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontWeight: 700,
                fontSize: { xs: '3rem', md: '3.6rem' },
                letterSpacing: '-1px',
                lineHeight: 1.05,
              }}
            >
              Pasyal
              <Box component="span" sx={{ display: 'block', color: '#e3c48d' }}>
                Pinas
              </Box>
            </Typography>

            <Typography
              sx={{
                mt: 2,
                mb: 3.5,
                lineHeight: 1.6,
                fontSize: '1rem',
                color: 'rgba(248, 236, 230, 0.82)',
              }}
            >
              Explore tourist spots across regions, cities, and
              municipalities in the Philippines.
            </Typography>

            <LocationForm onSearch={handleSearchSubmit} />
          </Box>

          <Box component="footer">
            <Typography
              variant="caption"
              sx={{ display: 'block', color: 'rgba(248, 236, 230, 0.65)' }}
            >
              Pasyal Pinas • It&apos;s More Fun in the Philippines!
            </Typography>
            <Typography
              variant="caption"
              sx={{ display: 'block', mt: 0.5, color: 'rgba(248, 236, 230, 0.5)' }}
            >
              Photos provided by{' '}
              <Link
                href="https://www.pexels.com"
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                sx={{ color: '#e3c48d' }}
              >
                Pexels
              </Link>
            </Typography>
          </Box>
        </Box>

        {/* Main Content Area */}
        <Box
          component="main"
          sx={{
            minWidth: 0,
            p: { xs: 2.5, md: 4 },
            borderRadius: '28px',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 2,
              mb: 3,
            }}
          >
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'primary.main',
                }}
              >
                <PhotoCamera fontSize="small" />
                <Typography
                  component="h2"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '1.3rem', md: '1.6rem' },
                    color: 'text.primary',
                  }}
                >
                  {searchedLocation
                    ? `Photos from ${searchedLocation}`
                    : 'Travel Inspiration'}
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Find your next favorite destination.
              </Typography>
            </Box>

            {photos.length > 0 && !loading && (
              <Chip
                label={`${photos.length} photos`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>

          <MediaGallery
            photos={photos}
            loading={loading}
            hasSearched={Boolean(searchedLocation)}
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
}