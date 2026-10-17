import React, { useState } from 'react';
import {
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Typography,
  Box,
  IconButton,
  Paper,
  Stack,
  Divider,
  Chip,
  keyframes,
} from '@mui/material';
import { LightMode, DarkMode, FlightTakeoff, Public } from '@mui/icons-material';
import LocationForm from './components/LocationForm';
import MediaGallery from './components/MediaGallery';
import { searchPhotosByLocation } from './services/geoPhotoService';

// ANIMATIONS
const driftClouds = keyframes`
  0% { transform: translateX(0px); }
  50% { transform: translateX(30px); }
  100% { transform: translateX(0px); }
`;

const twinkleStars = keyframes`
  0%, 100% { opacity: 0.2; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.3); }
`;

const shootingStar = keyframes`
  0% { transform: translateX(0) translateY(0) rotate(-45deg); opacity: 1; }
  100% { transform: translateX(-400px) translateY(400px) rotate(-45deg); opacity: 0; }
`;

// Generator para sa mga bituin
const generateStars = (count) => {
  return [...Array(count)].map((_, i) => {
    const x = Math.random() * 100;
    const y = Math.random() * 70;
    const size = Math.random() * 2 + 0.5;
    const delay = Math.random() * 5;
    return (
      <circle
        key={i}
        cx={`${x}%`}
        cy={`${y}%`}
        r={size}
        fill="#ffffff"
        sx={{
          animation: `${twinkleStars} ${3 + Math.random() * 4}s ease-in-out infinite`,
          animationDelay: `${delay}s`,
          transformOrigin: 'center',
        }}
      />
    );
  });
};

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: { main: isDarkMode ? '#10b981' : '#064e3b' },
      secondary: { main: '#eab308' },
      background: {
        default: isDarkMode ? '#02140f' : '#e2e8e4',
        paper: isDarkMode ? '#062b20' : '#ffffff',
      },
      text: {
        primary: isDarkMode ? '#f0fdf4' : '#022c22',
        secondary: isDarkMode ? '#86efac' : '#4b5563',
      },
      divider: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(6, 78, 59, 0.15)',
    },
    shape: { borderRadius: 16 },
    typography: {
      fontFamily: '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
      h1: { fontWeight: 900, letterSpacing: '-2px' },
    },
  });

  const handleSearchSubmit = async (locationName, regionName) => {
    setLoading(true);
    try {
      const results = await searchPhotosByLocation(locationName, regionName);
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
          minHeight: '100vh',
          position: 'relative',
          overflow: 'hidden',
          background: isDarkMode
            ? 'linear-gradient(to bottom, #020813 0%, #061a2e 40%, #02140f 100%)' 
            : 'linear-gradient(to bottom, #87CEEB 0%, #e0f2fe 50%, #e2e8e4 100%)',
          transition: 'background 0.8s ease-in-out',
        }}
      >
        {/* ========================================= */}
        {/* BACKGROUND GRAPHICS */}
        {/* ========================================= */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: { xs: '85vh', md: '90vh' },
            zIndex: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          {/* LIGHT MODE: Clouds & Sun */}
          {!isDarkMode && (
            <>
              <Box
                sx={{
                  position: 'absolute',
                  top: '-10%',
                  left: '-10%',
                  width: '120%',
                  height: '120%',
                  backgroundImage: 'url("https://images.unsplash.com/photo-1499346030926-9a72daac6c63?q=80&w=2000&auto=format&fit=crop")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.8,
                  animation: `${driftClouds} 40s ease-in-out infinite`,
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: '-50px',
                  right: '10%',
                  width: 300,
                  height: 300,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255,255,200,1) 0%, rgba(253,224,71,0.6) 40%, rgba(253,224,71,0) 70%)',
                  boxShadow: '0 0 100px 50px rgba(253,224,71,0.4)',
                }}
              />
            </>
          )}

          {/* DARK MODE: Beautiful Starry Night, Galaxy, Moon */}
          {isDarkMode && (
            <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#020813' }}>
              
              {/* Galaxy Glow Effect (Milky Way vibe) */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '-20%',
                  left: '-20%',
                  width: '140%',
                  height: '80%',
                  background: 'radial-gradient(ellipse at center, rgba(76, 29, 149, 0.15) 0%, rgba(2, 8, 19, 0) 60%)',
                  transform: 'rotate(-15deg)',
                }}
              />

              {/* Moon with realistic crater shading */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '-40px',
                  right: '10%',
                  width: 280,
                  height: 280,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #f1f5f9 40%, #cbd5e1 70%, #94a3b8 100%)',
                  boxShadow: '0 0 100px 40px rgba(255,255,255,0.15), inset -20px -20px 50px rgba(0,0,0,0.4)',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '30%',
                    left: '20%',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.1)',
                    boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.2)',
                  }
                }}
              />
              
              {/* TWINKLING STARS OVERLAY */}
              <svg width="100%" height="100%" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
                {generateStars(80)} 
              </svg>

              {/* SHOOTING STARS (Bulalakaw) */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '15%',
                  right: '20%',
                  width: '100px',
                  height: '2px',
                  background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)',
                  borderRadius: '50%',
                  boxShadow: '0 0 10px 2px #fff',
                  animation: `${shootingStar} 4s ease-in infinite`,
                  animationDelay: '2s',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: '30%',
                  right: '40%',
                  width: '80px',
                  height: '2px',
                  background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)',
                  borderRadius: '50%',
                  boxShadow: '0 0 8px 1px #fff',
                  animation: `${shootingStar} 6s ease-in infinite`,
                  animationDelay: '5s',
                }}
              />
            </Box>
          )}

          {/* ========================================= */}
          {/* MOUNTAINS AND PINE TREES */}
          {/* ========================================= */}
          
          {!isDarkMode && (
            <svg style={{ position: 'absolute', bottom: 0, width: '100%', height: 'auto' }} viewBox="0 0 1440 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <path fill="#5bb5c2" fillOpacity="0.5" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,208C960,192,1056,160,1152,154.7C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
              <path fill="#2d6a4f" d="M50,320 L60,260 L70,320 Z M80,320 L95,230 L110,320 Z M130,320 L145,250 L160,320 Z M1180,320 L1195,240 L1210,320 Z M1250,320 L1260,270 L1270,320 Z M1290,320 L1310,220 L1330,320 Z" />
              <path fill="#40916c" fillOpacity="0.8" d="M0,288L60,266.7C120,245,240,203,360,197.3C480,192,600,224,720,229.3C840,235,960,213,1080,197.3C1200,181,1320,171,1380,165.3L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z" />
              <path fill="#1b4332" d="M10,320 L20,280 L30,320 Z M170,320 L185,260 L200,320 Z M1120,320 L1135,280 L1150,320 Z M1350,320 L1365,250 L1380,320 Z M1400,320 L1410,270 L1420,320 Z" />
            </svg>
          )}

          {isDarkMode && (
            <svg style={{ position: 'absolute', bottom: 0, width: '100%', height: 'auto' }} viewBox="0 0 1440 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <path fill="#011a14" fillOpacity="0.9" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,208C960,192,1056,160,1152,154.7C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
              <path fill="#000000" d="M50,320 L60,260 L70,320 Z M80,320 L95,230 L110,320 Z M130,320 L145,250 L160,320 Z M1180,320 L1195,240 L1210,320 Z M1250,320 L1260,270 L1270,320 Z M1290,320 L1310,220 L1330,320 Z" />
              <path fill="#000a06" fillOpacity="0.95" d="M0,288L60,266.7C120,245,240,203,360,197.3C480,192,600,224,720,229.3C840,235,960,213,1080,197.3C1200,181,1320,171,1380,165.3L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z" />
              <path fill="#000000" d="M10,320 L20,280 L30,320 Z M170,320 L185,260 L200,320 Z M1120,320 L1135,280 L1150,320 Z M1350,320 L1365,250 L1380,320 Z M1400,320 L1410,270 L1420,320 Z" />
            </svg>
          )}
        </Box>

        {/* ========================================= */}
        {/* HERO SECTION CONTENT */}
        {/* ========================================= */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            minHeight: { xs: '85vh', md: '90vh' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            borderBottomLeftRadius: { xs: 30, md: 60 },
            borderBottomRightRadius: { xs: 30, md: 60 },
            overflow: 'hidden',
          }}
        >
          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 4, md: 6 } }}>
            
            {/* Top Bar */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: { xs: 4, md: 6 } }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    display: 'grid',
                    placeItems: 'center',
                    background: 'linear-gradient(135deg, #10b981, #eab308)',
                    color: '#fff',
                    boxShadow: isDarkMode ? '0 8px 20px rgba(16, 185, 129, 0.4)' : '0 8px 20px rgba(0,0,0,0.2)',
                  }}
                >
                  <FlightTakeoff sx={{ fontSize: 22 }} />
                </Box>
                <Box>
                  {/* BINAGO: Lakbay PH -> TechCare Travels */}
                  <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.5px', lineHeight: 1, color: isDarkMode ? '#fff' : '#064e3b', textShadow: isDarkMode ? '0 2px 10px rgba(0,0,0,0.8)' : 'none' }}>
                    TechCare <Box component="span" sx={{ color: 'secondary.main' }}>Travels</Box>
                  </Typography>
                  <Typography sx={{ fontSize: '.65rem', letterSpacing: 2, color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'rgba(6, 78, 59, 0.8)', fontWeight: 700, mt: 0.3 }}>
                    TRAVEL EXPLORER
                  </Typography>
                </Box>
              </Stack>

              <IconButton
                onClick={() => setIsDarkMode(!isDarkMode)}
                aria-label="Toggle dark mode"
                sx={{
                  width: 44,
                  height: 44,
                  border: '1px solid',
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(6, 78, 59, 0.2)',
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
                  color: isDarkMode ? '#fff' : '#064e3b',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.8)', 
                    transform: 'rotate(20deg)' 
                  },
                }}
              >
                {isDarkMode ? <LightMode fontSize="small" sx={{ color: 'secondary.main' }} /> : <DarkMode fontSize="small" />}
              </IconButton>
            </Stack>

            {/* Hero Text */}
            <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 }, mt: { xs: 4, md: 8 } }}>
              <Chip
                icon={<Public sx={{ fontSize: '14px !important', color: '#eab308 !important' }} />}
                label="EXPLORE THE ARCHIPELAGO"
                sx={{
                  mb: 3, px: 1, py: 2.2, borderRadius: 999, fontSize: '.7rem', fontWeight: 800, letterSpacing: 2,
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)', 
                  border: '1px solid',
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(6, 78, 59, 0.1)',
                  color: isDarkMode ? '#fff' : '#064e3b',
                  backdropFilter: 'blur(10px)',
                }}
              />

              {/* BINAGO: Main Headline */}
              <Typography
                component="h1"
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: '2.8rem', sm: '3.8rem', md: '5rem' },
                  lineHeight: 1.1,
                  letterSpacing: '-2.5px',
                  color: isDarkMode ? '#fff' : '#064e3b',
                  textShadow: isDarkMode ? '0 4px 30px rgba(0,0,0,0.9)' : '0 2px 10px rgba(255,255,255,0.5)',
                }}
              >
                TechCare{' '}
                <Box
                  component="span"
                  sx={{
                    background: isDarkMode 
                      ? 'linear-gradient(135deg, #34d399, #facc15)' 
                      : 'linear-gradient(135deg, #064e3b, #059669, #eab308)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Travels
                </Box>
              </Typography>

              {/* BINAGO: Tagline */}
              <Typography
                sx={{
                  mt: 3, mx: 'auto', maxWidth: 750, fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }, lineHeight: 1.6,
                  color: isDarkMode ? 'rgba(255,255,255,0.85)' : '#374151',
                  textShadow: isDarkMode ? '0 2px 10px rgba(0,0,0,0.9)' : 'none',
                  fontWeight: 500,
                }}
              >
                Where Technology Meets Your Paradise, and Every Journey Becomes Unforgettable.
              </Typography>
            </Box>

            {/* Search Card */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, md: 3 }, borderRadius: 5, border: '1px solid', borderColor: 'divider',
                bgcolor: isDarkMode ? 'rgba(6, 43, 32, 0.85)' : 'background.paper', 
                backdropFilter: 'blur(20px)',
                boxShadow: isDarkMode ? '0 25px 60px rgba(0,0,0,0.8)' : '0 25px 50px rgba(0,0,0,0.15)',
                maxWidth: 900, mx: 'auto', position: 'relative',
                '&::before': {
                  content: '""', position: 'absolute', top: 0, left: '20%', right: '20%', height: 4, borderRadius: '0 0 6px 6px',
                  background: 'linear-gradient(90deg, transparent, #10b981, #eab308, transparent)',
                },
              }}
            >
              <LocationForm onSearch={handleSearchSubmit} />
            </Paper>

          </Container>
        </Box>

        {/* ========================================= */}
        {/* GALLERY SECTION */}
        {/* ========================================= */}
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 5, md: 8 } }}>
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box
                    sx={{
                      width: 4, height: 36, borderRadius: 2,
                      background: isDarkMode ? 'linear-gradient(180deg, #10b981, #eab308)' : 'linear-gradient(180deg, #064e3b, #eab308)',
                    }}
                  />
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.3rem', md: '1.6rem' }, letterSpacing: '-0.5px', lineHeight: 1.2, color: isDarkMode ? '#fff' : '#064e3b' }}>
                      Travel Inspiration
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.3, color: isDarkMode ? 'rgba(255,255,255,0.7)' : '#4b5563' }}>
                      Curated spots to spark your next adventure
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Stack>

            <Divider sx={{ mb: 4, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'divider' }} />

            <MediaGallery photos={photos} loading={loading} />
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 8, pt: 3, borderTop: '1px solid', borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'divider', textAlign: 'center' }}>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 1 }}>
              <FlightTakeoff sx={{ fontSize: 16, color: 'secondary.main' }} />
              <Typography sx={{ fontWeight: 700, fontSize: '.85rem', letterSpacing: 0.5, color: isDarkMode ? '#fff' : '#064e3b' }}>
                {/* BINAGO: Footer Branding */}
                TechCare <Box component="span" sx={{ color: 'secondary.main' }}>Travels</Box>
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.5)' : '#4b5563' }}>
              Explore the beauty of the Philippines 🇵🇭
            </Typography>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}