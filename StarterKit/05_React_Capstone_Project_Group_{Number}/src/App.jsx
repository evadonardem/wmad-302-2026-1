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
  // [Your code here]

  // Dynamic Theme Creator configuration
  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
    },
  });

  const handleSearchSubmit = async (locationName) => {
    // TODO 3.8 [Operational Async Glue Engine]: 
    // a. Shift local state property configuration 'loading' to true.
    // b. Fire the async handler function 'searchPhotosByLocation(locationName)' inside an await statement.
    // c. Capture resulting photo dataset arrays inside the local state 'photos'.
    // d. Toggle the operation state status trackers 'loading' back to false inside an executive safety wrapper execution tier.
    // [Your code here]
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ minHeight: '100vh', py: 4 }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, textAlign: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <IconButton onClick={() => setIsDarkMode(!isDarkMode)} color="inherit">
              {isDarkMode ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Box>

          <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
            🇵🇭 Lakbay PH
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
            Explore tourist spots across regions, cities, and municipalities in the Philippines
          </Typography>

          {/* Connect the location selection input modules */}
          <LocationForm onSearch={handleSearchSubmit} />
        </Paper>

        {/* Connect presentation display layout nodes passing state parameters downstream */}
        <MediaGallery photos={photos} loading={loading} />
      </Container>
    </ThemeProvider>
  );
}