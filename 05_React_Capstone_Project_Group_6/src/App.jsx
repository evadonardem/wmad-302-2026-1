import React, { useEffect, useMemo, useState } from 'react';
import {
  Container, CssBaseline, ThemeProvider, createTheme, Typography, Box, IconButton,
  Paper, Autocomplete, TextField, InputAdornment,
} from '@mui/material';
import { LightMode, DarkMode, Search } from '@mui/icons-material';
import LocationForm from './components/LocationForm';
import MediaGallery from './components/MediaGallery';
import { searchPhotosByLocation, getPlaceIndex, cleanPlaceName } from './services/geoPhotoService';


const DEFAULT_PLACE = 'Philippines';
export function LiveBackground({ photos }) {
  const slides = useMemo(() => photos.slice(0, 8), [photos]);
  const [i, setI] = useState(0);

  useEffect(() => {
    setI(0);
    if (slides.length < 2) return undefined;
    const t = setInterval(() => setI((n) => (n + 1) % slides.length), 8000);
    return () => clearInterval(t);
  }, [slides]);

  return (
    <Box aria-hidden sx={{ position: 'fixed', inset: 0, zIndex: 0, bgcolor: '#0b2a3a', overflow: 'hidden' }}>
      <style>{`@keyframes kb{from{transform:scale(1)}to{transform:scale(1.12)}}
      @media (prefers-reduced-motion: reduce){.kb{animation:none!important}}`}</style>
      {slides.map((p, n) => (
        <Box
          key={p.id}
          className="kb"
          sx={{
            position: 'absolute', inset: 0, backgroundImage: `url(${p.fullUrl})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: n === i ? 1 : 0, transition: 'opacity 2s ease-in',
            animation: n === i ? 'kb 9s ease-out forwards' : 'none',
          }}
        />
      ))}
      <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(5,25,40,.55), rgba(5,25,40,.85))' }} />
    </Box>
  );
}



export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // TODO 3.7 [Global Search Coordination]: Instantiate matching dynamic local state trackers here:
  // - 'photos': Tracks array results fetched from the Pexels service handler (default: empty array)
  // - 'loading': Toggles boolean state workflows during operations (default: false)
  // [Your code here]
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  const [placeName, setPlaceName] = useState(DEFAULT_PLACE);
  const [places, setPlaces] = useState([]);

  // Dynamic Theme Creator configuration
  const theme = useMemo(() => createTheme({
    palette: { mode: isDarkMode ? 'dark' : 'light' },
    typography: { fontFamily: '"Poppins", system-ui, sans-serif' },
  }), [isDarkMode]);

  const handleSearchSubmit = async (locationName) => {
    // TODO 3.8 [Operational Async Glue Engine]: 
    // a. Shift local state property configuration 'loading' to true.
    // b. Fire the async handler function 'searchPhotosByLocation(locationName)' inside an await statement.
    // c. Capture resulting photo dataset arrays inside the local state 'photos'.
    // d. Toggle the operation state status trackers 'loading' back to false inside an executive safety wrapper execution tier.
    // [Your code here]
    const name = cleanPlaceName(locationName) || DEFAULT_PLACE;
    setLoading(true);
    try {
      const results = await searchPhotosByLocation(name);
      setPhotos(results);
      setPlaceName(name); // the big title switches once the results arrive
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearchSubmit(DEFAULT_PLACE);
    getPlaceIndex().then(setPlaces);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LiveBackground photos={photos} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, minHeight: '100vh', py: 3 }}>
        {/* Top bar: brand, Philippines-only search, Light/Dark switch */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: { xs: 4, md: 10 }, color: '#fff' }}>
          <Typography variant="h6" fontWeight={700} sx={{ whiteSpace: 'nowrap' }}>Philippine Compass</Typography>
          <Autocomplete
            sx={{ flex: 1, maxWidth: 460, ml: 'auto' }}
            size="small"
            options={places}
            loading={places.length === 0}
            getOptionLabel={(o) => o.name}
            groupBy={(o) => o.type}
            isOptionEqualToValue={(a, b) => a.code === b.code}
            noOptionsText="Not a Philippine province, city or municipality"
            onChange={(_, value) => value && handleSearchSubmit(value.name)}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search a Philippine place, e.g. Batanes"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
                  ),
                }}
                sx={{border: '1px solid #ccc', borderRadius: 1, '& input': { color: '#ffffff' }, '& svg': { color: '#ffffff' } }}
              />
            )}
          />
          <IconButton aria-label="Toggle light and dark mode" onClick={() => setIsDarkMode(!isDarkMode)} sx={{ color: '#fff' }}>
            {isDarkMode ? <LightMode /> : <DarkMode />}
          </IconButton>
        </Box>

        {/* Hero title: "Philippines" becomes the searched place */}
        <Box sx={{ color: '#fff', mb: 5 }}>
          <Typography
            variant="h1"
            component="h1"
            sx={{ fontWeight: 800, textTransform: 'uppercase', lineHeight: 1, fontSize: { xs: '2.6rem', sm: '4.5rem', md: '6.5rem' }, textShadow: '0 4px 30px rgba(0,0,0,.4)', overflowWrap: 'anywhere' }}
          >
            {placeName}
          </Typography>
          <Typography sx={{ mt: 2, maxWidth: 560, opacity: 0.9 }}>
            {placeName === DEFAULT_PLACE
              ? 'Explore tourist spots across regions, cities, and municipalities in the Philippines.'
              : `Tourist spots in ${placeName}. Select a photo to see it larger.`}
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 3, mb: 4, borderRadius: 3, backdropFilter: 'blur(14px)',
            bgcolor: isDarkMode ? 'rgba(10,25,40,.6)' : 'rgba(255, 255, 255, 0.16)',
          }}
        >
          {/* Connect the location selection input modules */}
          <LocationForm onSearch={handleSearchSubmit} />
        </Paper>

        {/* Connect presentation display layout nodes passing state parameters downstream */}
        <MediaGallery photos={photos} loading={loading} placeName={placeName} />
      </Container>

      





    </ThemeProvider>
  );
}