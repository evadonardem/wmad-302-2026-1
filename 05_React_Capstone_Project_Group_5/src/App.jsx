import React, { useEffect, useMemo, useState } from 'react';
import {AppBar,Toolbar,Container,CssBaseline,ThemeProvider,createTheme,Typography,Box,IconButton,Paper,Tooltip,Link,Button,Menu,MenuItem,Stack,} from '@mui/material';
import {LightMode,DarkMode,TravelExplore,Terrain,BeachAccess,Waves,WaterDrop,Church,Forest,WbSunny,Umbrella,AcUnit,ExpandMore,} from '@mui/icons-material';
import LocationForm from './components/LocationForm';
import MediaGallery from './components/MediaGallery';
import { getRegions, searchPhotosByLocation } from './services/geoPhotoService';

// Tourist categories (each one is searched as "Philippines <category>")
const CATEGORIES = [
  { label: 'Mountain', Icon: Terrain },
  { label: 'Beach', Icon: BeachAccess },
  { label: 'Island', Icon: Waves },
  { label: 'Waterfall', Icon: WaterDrop },
  { label: 'Church', Icon: Church },
  { label: 'Forest', Icon: Forest },
];

// Recommended destinations for each season
const SEASONS = [
  { label: 'Summer', months: 'Mar–May', Icon: WbSunny, spots: ['Boracay', 'El Nido', 'Siargao'] },
  { label: 'Rainy season', months: 'Jun–Nov', Icon: Umbrella, spots: ['Baguio', 'Tagaytay', 'Sagada'] },
  { label: 'Cool season', months: 'Dec–Feb', Icon: AcUnit, spots: ['Mt. Pulag', 'Batanes', 'Bohol'] },
];

// Makes icon + text fit inside a button on any screen width
const buttonFitSx = {
  minWidth: 0,
  width: '100%',
  px: 1,
  py: 0.75,
  fontSize: { xs: '0.8rem', sm: '0.85rem' },
  whiteSpace: 'nowrap',
  justifyContent: 'center',
  '& .MuiButton-startIcon': { mr: 0.5, ml: 0, '& > *:nth-of-type(1)': { fontSize: 18 } },
  '& .MuiButton-endIcon': { ml: 0.25, mr: 0, '& > *:nth-of-type(1)': { fontSize: 18 } },
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // TODO 3.7 [Global Search Coordination]: Instantiate matching dynamic local state trackers here:
  // - 'photos': Tracks array results fetched from the Pexels service handler (default: empty array)
  // - 'loading': Toggles boolean state workflows during operations (default: false)
  // [Your code here]

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState('');

  // Random featured destinations (one random photo from 6 random regions)
  const [featured, setFeatured] = useState([]);

  // Season dropdown menu
  const [seasonAnchor, setSeasonAnchor] = useState(null);
  const [activeSeason, setActiveSeason] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadFeatured = async () => {
      const regions = await getRegions();
      const picks = [...regions].sort(() => Math.random() - 0.5).slice(0, 6);

      const results = await Promise.all(
        picks.map(async (region) => {
          const found = await searchPhotosByLocation(region.name);
          return found.length
            ? { name: region.name, photo: found[Math.floor(Math.random() * found.length)] }
            : null;
        })
      );

      if (!cancelled) setFeatured(results.filter(Boolean));
    };

    loadFeatured();

    return () => {
      cancelled = true;
    };
  }, []);

  // Dynamic Theme Creator configuration
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDarkMode ? 'dark' : 'light',
          primary: { main: isDarkMode ? '#4DD0C8' : '#0B7A75' },
          secondary: { main: '#F4B63F' },
          background: isDarkMode
            ? { default: '#0E1A1F', paper: '#15272E' }
            : { default: '#F3F8F8', paper: '#FFFFFF' },
        },
        shape: { borderRadius: 16 },
        typography: {
          fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
          h3: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 800, letterSpacing: '-0.02em' },
          h4: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 700 },
          h5: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 700 },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: { textTransform: 'none', borderRadius: 999, fontWeight: 600 },
            },
          },
        },
      }),
    [isDarkMode]
  );

  const handleSearchSubmit = async (locationName) => {
    // TODO 3.8 [Operational Async Glue Engine]: 
    // a. Shift local state property configuration 'loading' to true.
    // b. Fire the async handler function 'searchPhotosByLocation(locationName)' inside an await statement.
    // c. Capture resulting photo dataset arrays inside the local state 'photos'.
    // d. Toggle the operation state status trackers 'loading' back to false inside an executive safety wrapper execution tier.
    // [Your code here]

    // Scroll up so the results are visible when a featured/category/season item is clicked
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setLoading(true);
    setHasSearched(true);
    setSearchedLocation(locationName);

    try {
      const results = await searchPhotosByLocation(locationName);
      setPhotos(results);
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

      {/* Top bar with dark/light toggle */}
      <AppBar position="absolute" color="transparent" elevation={0} sx={{ color: '#fff' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TravelExplore />
            <Typography variant="h6" fontWeight={700}>
              Lakbay PH
            </Typography>
          </Box>
          <Tooltip title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton onClick={() => setIsDarkMode(!isDarkMode)} color="inherit" aria-label="toggle theme">
              {isDarkMode ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Hero banner */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          color: '#fff',
          textAlign: 'center',
          pt: { xs: 12, md: 14 },
          pb: { xs: 14, md: 16 },
          px: 2,
          background: (t) =>
            t.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #0A2E33 0%, #0E1A1F 100%)'
              : 'linear-gradient(135deg, #0B7A75 0%, #2BB3A8 60%, #F4B63F 150%)',
        }}
      >
        {/* Decorative circles */}
        <Box sx={{ position: 'absolute', top: -80, left: -80, width: 260, height: 260, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
        <Box sx={{ position: 'absolute', bottom: -100, right: -60, width: 320, height: 320, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />

        <Container maxWidth="md" sx={{ position: 'relative' }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontSize: { xs: '2.2rem', md: '3rem' } }}>
            🇵🇭 Lakbay PH
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
            Explore tourist spots across regions, cities, and municipalities in the Philippines
          </Typography>
        </Container>
      </Box>

      {/* Floating search card */}
      <Container maxWidth="md" sx={{ mt: { xs: -9, md: -10 }, position: 'relative', zIndex: 2 }}>
        <Paper elevation={8} sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 5 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, textAlign: 'center' }}>
            Where do you want to go?
          </Typography>

          {/* Connect the location selection input modules */}
          <LocationForm onSearch={handleSearchSubmit} />

          {/* Quick filters: categories + best time to go */}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 3, mb: 1, textAlign: 'center' }}>
            Browse by category
          </Typography>
          <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' } }}>
            {CATEGORIES.map(({ label, Icon }) => (
              <Button
                key={label}
                variant="outlined"
                size="small"
                startIcon={<Icon />}
                onClick={() => handleSearchSubmit(`Philippines ${label}`)}
                sx={buttonFitSx}
              >
                {label}
              </Button>
            ))}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1, textAlign: 'center' }}>
            Best time to go
          </Typography>
          <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' } }}>
            {SEASONS.map((season) => (
              <Button
                key={season.label}
                variant="contained"
                color="secondary"
                size="small"
                startIcon={<season.Icon />}
                endIcon={<ExpandMore />}
                onClick={(e) => {
                  setActiveSeason(season);
                  setSeasonAnchor(e.currentTarget);
                }}
                sx={buttonFitSx}
              >
                {season.label}
              </Button>
            ))}
          </Box>

          <Menu anchorEl={seasonAnchor} open={Boolean(seasonAnchor)} onClose={() => setSeasonAnchor(null)}>
            {activeSeason && (
              <Typography variant="caption" color="text.secondary" sx={{ px: 2, pb: 0.5, display: 'block' }}>
                Best spots for {activeSeason.label.toLowerCase()} ({activeSeason.months})
              </Typography>
            )}
            {activeSeason?.spots.map((spot) => (
              <MenuItem
                key={spot}
                onClick={() => {
                  setSeasonAnchor(null);
                  handleSearchSubmit(spot);
                }}
              >
                {spot}
              </MenuItem>
            ))}
          </Menu>
        </Paper>
      </Container>

      {/* Results */}
      <Container maxWidth="lg" sx={{ py: 6, minHeight: '40vh' }}>
        {/* Connect presentation display layout nodes passing state parameters downstream */}
        <MediaGallery
          photos={photos}
          loading={loading}
          hasSearched={hasSearched}
          locationName={searchedLocation}
        />
      </Container>

      {/* Discover: featured destinations, categories and seasonal picks */}
      <Container maxWidth="lg" sx={{ pb: 8 }}>
        {/* Featured destinations (random regions) */}
        <Typography variant="h5" sx={{ mb: 2 }}>
          Featured destinations
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          }}
        >
          {featured.map(({ name, photo }) => (
            <Box
              key={name}
              role="button"
              tabIndex={0}
              aria-label={`Explore ${name}`}
              onClick={() => handleSearchSubmit(name)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(name)}
              sx={{
                position: 'relative',
                height: { xs: 190, md: 220 },
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'pointer',
                '&:hover img': { transform: 'scale(1.06)' },
              }}
            >
              <Box
                component="img"
                src={photo.imageUrl}
                alt={photo.altText}
                loading="lazy"
                sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(4,14,18,0.95) 0%, rgba(4,14,18,0.75) 35%, rgba(4,14,18,0) 80%)',
                }}
              />
              <Box sx={{ position: 'absolute', left: 14, bottom: 12, right: 14, color: '#fff' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.2, mb: 0.25, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>{name}</Typography>
                {photo.altText && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.3,
                      fontSize: '0.8rem',
                      color: '#fff',
                      textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                    }}
                  >
                    {photo.altText}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </Container>

      {/* Footer with Pexels credit */}
      <Box component="footer" sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">
          Photos provided by{' '}
          <Link href="https://www.pexels.com" target="_blank" rel="noopener noreferrer">
            Pexels
          </Link>{' '}
          · Location data from PSGC
        </Typography>
      </Box>
    </ThemeProvider>
  );
}