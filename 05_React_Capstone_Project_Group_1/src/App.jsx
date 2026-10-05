import React, { useEffect, useState } from 'react';
import {
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Typography,
  Box,
  IconButton,
  Paper,
} from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import LocationForm from './components/LocationForm';
import MediaGallery from './components/MediaGallery';
import { searchPhotosByLocation } from './services/geoPhotoService';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // TODO 3.7 [Global Search Coordination]: Store photos, loading status, and location name.
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationName, setLocationName] = useState('');

  // Moving travel background images
  const travelBackgrounds = [
    'https://images.pexels.com/photos/1028225/pexels-photo-1028225.jpeg',
    'https://images.pexels.com/photos/1483053/pexels-photo-1483053.jpeg',
    'https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg',
    'https://images.pexels.com/photos/457882/pexels-photo-457882.jpeg',
    'https://images.pexels.com/photos/1687575/pexels-photo-1687575.jpeg',
  ];

  const [backgroundIndex, setBackgroundIndex] = useState(0);

  // Automatically change the header background image
  useEffect(() => {
    const interval = setInterval(() => {
      setBackgroundIndex((current) =>
        (current + 1) % travelBackgrounds.length
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Dynamic Theme Creator configuration
  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',

      primary: {
        main: isDarkMode ? '#7DD3C7' : '#146C63',
      },

      secondary: {
        main: isDarkMode ? '#A7D8A3' : '#5F946A',
      },

      background: {
        // Teal and sage colors for a softer light mode
        default: isDarkMode ? '#101C1A' : '#D5E8DF',
        paper: isDarkMode ? '#192927' : '#C4DED3',
      },

      text: {
        primary: isDarkMode ? '#F1F7F5' : '#163C35',
        secondary: isDarkMode ? '#B7CCC7' : '#4F7068',
      },
    },

    // Global Autocomplete dropdown styling
    components: {
      MuiAutocomplete: {
        styleOverrides: {
          paper: {
            backgroundColor: '#FFFFFF',
            color: '#000000',
          },

          listbox: {
            backgroundColor: '#FFFFFF',
            color: '#000000',

            '& .MuiAutocomplete-option': {
              color: '#000000',
              backgroundColor: '#FFFFFF',
            },

            '& .MuiAutocomplete-option:hover': {
              backgroundColor: '#E8F5F0',
              color: '#000000',
            },

            '& .MuiAutocomplete-option[aria-selected="true"]': {
              backgroundColor: '#D5E8DF',
              color: '#000000',
            },

            '& .MuiAutocomplete-option[aria-selected="true"]:hover': {
              backgroundColor: '#C4DED3',
              color: '#000000',
            },
          },
        },
      },
    },
  });

  const handleSearchSubmit = async (locationName) => {
    // TODO 3.8 [Operational Async Glue Engine]: Search the location and update photos and loading states.
    setLoading(true);
    setLocationName(locationName);

    try {
      const results = await searchPhotosByLocation(locationName);
      setPhotos(results);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Container
        maxWidth={false}
        sx={{
          minHeight: '100vh',
          py: 4,
          px: 4,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            position: 'relative',
            overflow: 'hidden',
            p: 4,
            borderRadius: 4,
            textAlign: 'center',
            mb: 3,

            border: '1px solid',
            borderColor: isDarkMode ? '#31514B' : '#91BBAA',

            boxShadow: isDarkMode
              ? '0 10px 35px rgba(0,0,0,0.25)'
              : '0 10px 35px rgba(20, 80, 70, 0.15)',
          }}
        >
          {/* Moving Travel Background */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${travelBackgrounds[backgroundIndex]})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transition: 'background-image 1.5s ease-in-out',
              zIndex: 0,
            }}
          />

          {/* Dark / Teal Overlay */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: isDarkMode
                ? 'linear-gradient(rgba(5, 20, 18, 0.82), rgba(5, 20, 18, 0.90))'
                : 'linear-gradient(rgba(8, 40, 34, 0.72), rgba(8, 40, 34, 0.82))',
              zIndex: 1,
            }}
          />

          {/* Header Content */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 2,
            }}
          >
            {/* Dark Mode Button */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                mb: 2,
              }}
            >
              <IconButton
                onClick={() => setIsDarkMode(!isDarkMode)}
                sx={{
                  color: '#FFFFFF',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.22)',
                  },
                }}
              >
                {isDarkMode ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Box>

            {/* Lakbay PH Title */}
            <Box sx={{ mb: 1 }}>
              <Typography
                variant="overline"
                sx={{
                  display: 'block',
                  fontWeight: 700,
                  letterSpacing: '4px',
                  color: '#E8F5F0',
                  mb: 0.5,
                  textShadow: '0 2px 5px rgba(0,0,0,0.7)',
                }}
              >
                TRAVEL • EXPLORE • DISCOVER
              </Typography>

              <Typography
                component="h1"
                sx={{
                  fontSize: {
                    xs: '2.5rem',
                    sm: '3.2rem',
                    md: '4rem',
                  },
                  fontWeight: 800,
                  letterSpacing: '-1px',
                  lineHeight: 1,
                  color: '#FFFFFF',
                  textShadow: '0 3px 10px rgba(0,0,0,0.8)',
                }}
              >
                Lakbay{' '}
                <Box
                  component="span"
                  sx={{
                    color: '#B8E5D5',
                    fontWeight: 900,
                    textShadow: '0 3px 10px rgba(0,0,0,0.8)',
                  }}
                >
                  PH
                </Box>
              </Typography>
            </Box>

            <Typography
              variant="subtitle1"
              sx={{
                mb: 4,
                color: '#F5FAF8',
                textShadow: '0 2px 8px rgba(0,0,0,0.8)',
              }}
            >
              Explore tourist spots across regions, cities, and municipalities in the Philippines
            </Typography>

            {/* Connect the location selection input modules */}
            <Box
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.94)',
                  borderRadius: 2,
                },

                // Selected Region / City text
                '& .MuiOutlinedInput-input': {
                  color: '#000000',
                },

                // Select Region / City labels
                '& .MuiInputLabel-root': {
                  color: '#000000',
                },

                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#000000',
                },

                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.9)',
                },

                '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#146C63',
                },

                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#146C63',
                  borderWidth: 2,
                },

                // Dropdown arrow
                '& .MuiAutocomplete-popupIndicator': {
                  color: '#000000',
                },

                // Clear button
                '& .MuiAutocomplete-clearIndicator': {
                  color: '#000000',
                },

                // Search button
                '& .MuiButton-root': {
                  backgroundColor: '#146C63',
                  color: '#FFFFFF',
                },

                '& .MuiButton-root:hover': {
                  backgroundColor: '#0F554E',
                },
              }}
            >
              <LocationForm onSearch={handleSearchSubmit} />
            </Box>
          </Box>
        </Paper>

        {/* Connect presentation display layout nodes passing state parameters downstream */}
        <MediaGallery
          photos={photos}
          loading={loading}
          locationName={locationName}
        />
      </Container>
    </ThemeProvider>
  );
}