import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Typography,
  Box,
  IconButton,
  Paper,
  Tooltip,
  Link,
  Button,
  Menu,
  MenuItem,
  Stack,
  Alert,
} from '@mui/material';
import {
  LightMode,
  DarkMode,
  TravelExplore,
  Terrain,
  BeachAccess,
  Waves,
  WaterDrop,
  Church,
  Forest,
  WbSunny,
  Umbrella,
  AcUnit,
  ExpandMore,
  ChevronLeft,  // ADDED
  ChevronRight, // ADDED
} from '@mui/icons-material';
import LocationForm from './components/LocationForm';
import MediaGallery from './components/MediaGallery';
import { getRegions, searchPhotosByLocation } from './services/geoPhotoService';

// Tourist categories (combined with the chosen location, e.g. "La Trinidad Mountain")
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

// If a category has no photos in the chosen place, these similar spots IN THE SAME PLACE are tried next
const ALTERNATIVES = {
  Beach: [{ term: 'swimming pool', label: 'swimming pools' }, { term: 'resort', label: 'resorts' }],
  Mountain: [{ term: 'hills', label: 'hills' }, { term: 'viewpoint', label: 'viewpoints' }],
  Island: [{ term: 'lake', label: 'lakes' }, { term: 'coast', label: 'coastal views' }],
  Waterfall: [{ term: 'river', label: 'rivers' }, { term: 'spring', label: 'springs' }],
  Church: [
    { term: 'building', label: 'tourist buildings' },
    { term: 'landmark', label: 'landmarks' },
    { term: 'museum', label: 'museums' },
  ],
  Forest: [{ term: 'park', label: 'parks' }, { term: 'garden', label: 'gardens' }],
};

// Only used when no place is chosen (Philippines-wide) and a category has no photos at all
const RECOMMENDED = {
  Beach: ['Boracay', 'Panglao', 'El Nido'],
  Mountain: ['Mt. Pulag', 'Mount Apo', 'Mayon Volcano'],
  Island: ['Palawan', 'Siargao', 'Camiguin'],
  Waterfall: ['Pagsanjan Falls', 'Tinuy-an Falls', 'Kawasan Falls'],
  Church: ['Paoay Church', 'San Agustin Church', 'Miagao Church'],
  Forest: ['Bohol Man-made Forest', 'Sagada', 'Banaue'],
};

// Words a photo's caption/title must contain to count as that kind of spot
const TERM_WORDS = {
  beach: ['beach', 'shore', 'shoreline', 'seaside', 'coast', 'sand', 'ocean', 'sea', 'bay'],
  mountain: ['mountain', 'mount', 'peak', 'summit', 'hill', 'highland', 'volcano', 'cliff'],
  island: ['island', 'islet', 'archipelago', 'lagoon'],
  waterfall: ['waterfall', 'fall', 'cascade'],
  church: ['church', 'cathedral', 'basilica', 'chapel'],
  forest: ['forest', 'jungle', 'woods', 'tree', 'pine', 'trail'],
  'swimming pool': ['pool', 'swimming'],
  resort: ['resort', 'hotel', 'villa'],
  hills: ['hill', 'highland', 'mountain', 'valley', 'field'],
  viewpoint: ['view', 'viewpoint', 'overlook', 'panorama', 'scenic'],
  lake: ['lake', 'lagoon', 'pond'],
  coast: ['coast', 'shore', 'cliff', 'sea', 'ocean'],
  river: ['river', 'stream', 'creek'],
  spring: ['spring', 'stream', 'pool'],
  chapel: ['chapel', 'church'],
  cathedral: ['cathedral', 'church', 'basilica'],
  park: ['park', 'garden', 'lawn'],
  garden: ['garden', 'flower', 'park', 'farm'],
  building: ['building', 'architecture', 'structure', 'facade', 'heritage', 'historic', 'tower', 'hall', 'house', 'mansion'],
  landmark: ['landmark', 'monument', 'statue', 'plaza', 'historic', 'heritage', 'gate'],
  museum: ['museum', 'gallery', 'exhibit'],
};

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const shuffle = (list) => [...list].sort(() => Math.random() - 0.5);

// ---- Photo filtering: Pexels has no location data, so we check the photo's caption/title text ----
const PH_RE = /philippin|filipin|pinoy|pilipinas/;
const norm = (s) =>
  s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\bmt\b/g, 'mount').replace(/\s+/g, ' ').trim();
// "City of Baguio" -> "baguio"
const placeCore = (name) =>
  norm(name.replace(/\(.*?\)/g, '').replace(/^(island garden city of|city of|municipality of)\s+/i, '').replace(/\s+city$/i, ''));
const photoText = (p) => ` ${norm(`${p.altText || ''} ${(p.sourceUrl || '').split('/photo/')[1] || ''}`)} `;

// strict + place: keep only photos that mention the place. Otherwise put Philippine photos first.
const focusPhotos = (photos, place, strict) => {
  if (strict && place) {
    const core = ` ${placeCore(place)} `;
    return photos.filter((p) => photoText(p).includes(core));
  }
  const ph = photos.filter((p) => PH_RE.test(photoText(p)));
  return ph.length >= 4 ? ph : [...ph, ...photos.filter((p) => !ph.includes(p))];
};

// Does the photo's caption/title mention this kind of spot? (e.g. "beach" -> beach, shore, sand...)
const matchesTerm = (photo, term) => {
  const words = TERM_WORDS[term] || [norm(term)];
  const tokens = new Set(photoText(photo).trim().split(' '));
  return words.some((w) => tokens.has(w) || tokens.has(`${w}s`) || tokens.has(`${w}es`));
};

// Photos of well-known destinations (each one must mention the destination's name)
const findSpots = async (spots, category, label) => {
  const lists = await Promise.all(
    spots.map(async (spot) => {
      const query = [spot, 'Philippines', category && category.toLowerCase()].filter(Boolean).join(' ');
      const found = focusPhotos(await searchPhotosByLocation(query, 40), spot, true);
      return found.slice(0, 4).map((p) => ({ ...p, location: spot, category, recommended: label }));
    })
  );
  return { names: spots.filter((_, i) => lists[i].length), photos: lists.flat() };
};

// Finds photos for one category in one place. If there are none, similar spots in the SAME place are
// recommended (e.g. swimming pools for beaches, tourist buildings for churches), and if there are none of
// those either, other tourist spots of that place are shown.
const findForCategory = async (place, category, strict) => {
  // ADDED: 'strictMode' lets the last fallback skip the "caption must mention the place" rule
  const find = async (term, strictMode = strict) => {
    const query = [place, 'Philippines', term].filter(Boolean).join(' ');
    const found = focusPhotos(await searchPhotosByLocation(query), place, strictMode); // 100 photos
    return (term ? found.filter((p) => matchesTerm(p, term)) : found).slice(0, 30);
  };
  const tag = (photos, recommended = null) =>
    photos.map((p) => ({ ...p, location: place || 'Philippines', category, recommended }));

  if (!category) {
    const all = await find('');
    // ADDED: a place with no photos naming it still shows its closest tourist-spot results
    if (all.length || !place) return { category, photos: tag(all) };
    return { category, loose: true, photos: tag(await find('', false), 'tourist spot') };
  }

  const direct = await find(category.toLowerCase());
  if (direct.length) return { category, photos: tag(direct) };

  // No place chosen: recommend well-known destinations for this category
  if (!place) {
    const rec = await findSpots(RECOMMENDED[category], category, `${category.toLowerCase()} destination`);
    return { category, missing: true, spots: rec.names, photos: rec.photos };
  }

  // 1) similar spots in the same place
  const alts = ALTERNATIVES[category];
  const lists = await Promise.all(alts.map(({ term }) => find(term)));
  const hits = alts.map((alt, i) => ({ alt, photos: lists[i] })).filter((hit) => hit.photos.length);
  if (hits.length) {
    const mixed = [];
    for (let i = 0; i < 30; i += 1) hits.forEach((hit) => hit.photos[i] && mixed.push({ photo: hit.photos[i], term: hit.alt.term }));
    return {
      category,
      missing: true,
      altLabels: hits.map((hit) => hit.alt.label),
      photos: mixed.slice(0, 30).map(({ photo, term }) => ({ ...photo, location: place, category, recommended: term })),
    };
  }

  // 2) other tourist spots of the same place
  const general = await find('');
  if (general.length) return { category, missing: true, general: true, photos: tag(general, 'tourist spot') };

  // 3) ADDED: no photo names the place, so show the closest tourist-spot results for that place anyway
  const loose = await find('', false);
  return { category, missing: true, general: true, loose: true, photos: tag(loose, 'tourist spot') };
};

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

// ADDED: one featured card that is its own carousel (several photos of the same region)
// 'tick' comes from App (one shared timer), so all cards change photo at the same moment
function FeaturedCard({ name, photos, tick, onPause, active, onSelect }) {
  const [offset, setOffset] = useState(0); // moved by this card's arrows

  const count = photos.length;
  const index = (((tick + offset) % count) + count) % count;

  const go = (e, step) => {
    e.stopPropagation(); // do not trigger the region search
    setOffset((o) => o + step);
  };

  const photo = photos[index];

  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label={`Explore ${name}`}
      aria-pressed={active}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      onMouseEnter={() => onPause(true)}
      onMouseLeave={() => onPause(false)}
      sx={{
        position: 'relative',
        height: { xs: 190, md: 220 },
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        outline: (t) => (active ? `3px solid ${t.palette.primary.main}` : 'none'),
        outlineOffset: 2,
        '&:hover img': { transform: 'scale(1.06)' },
        '&:hover .card-arrow': { opacity: 1 },
      }}
    >
      {/* All photos are stacked; only the current one is visible (fade between them) */}
      {photos.map((p, i) => (
        <Box
          key={p.id}
          component="img"
          src={p.imageUrl}
          alt={p.altText}
          loading="lazy"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: i === index ? 1 : 0,
            transition: 'opacity 0.8s ease, transform 0.5s ease',
          }}
        />
      ))}

      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(4,14,18,0.95) 0%, rgba(4,14,18,0.75) 35%, rgba(4,14,18,0) 80%)',
        }}
      />

      <Box sx={{ position: 'absolute', left: 14, bottom: 12, right: 14, color: '#fff' }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.2, mb: 0.25, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
          {name}
        </Typography>
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

      {photos.length > 1 && (
        <>
          <IconButton
            className="card-arrow"
            size="small"
            aria-label="previous photo"
            onClick={(e) => go(e, -1)}
            sx={{ position: 'absolute', left: 6, top: '40%', color: '#fff', bgcolor: 'rgba(0,0,0,0.45)', opacity: 0, transition: 'opacity 0.3s ease', '&:hover': { bgcolor: 'rgba(0,0,0,0.65)' } }}
          >
            <ChevronLeft />
          </IconButton>
          <IconButton
            className="card-arrow"
            size="small"
            aria-label="next photo"
            onClick={(e) => go(e, 1)}
            sx={{ position: 'absolute', right: 6, top: '40%', color: '#fff', bgcolor: 'rgba(0,0,0,0.45)', opacity: 0, transition: 'opacity 0.3s ease', '&:hover': { bgcolor: 'rgba(0,0,0,0.65)' } }}
          >
            <ChevronRight />
          </IconButton>

          {/* Dots */}
          <Stack direction="row" spacing={0.5} sx={{ position: 'absolute', top: 10, right: 10 }}>
            {photos.map((p, i) => (
              <Box
                key={p.id}
                sx={{
                  width: i === index ? 16 : 6,
                  height: 6,
                  borderRadius: 3,
                  bgcolor: i === index ? '#fff' : 'rgba(255,255,255,0.55)',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </Stack>
        </>
      )}
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
  const [hasSearched, setHasSearched] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState('');

  // Active filters: one location (city / region / spot) + any number of categories
  const [location, setLocation] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [strictPlace, setStrictPlace] = useState(true); // true = photos must mention the chosen city
  const [seasonSpot, setSeasonSpot] = useState(''); // season picks are searched on their own
  const [notices, setNotices] = useState([]); // messages shown above the photos
  const requestId = useRef(0); // ignores results of older, slower searches

  // Random featured destinations (up to 5 random photos from each of 6 random regions)
  const [featured, setFeatured] = useState([]);

  // ADDED: shared carousel timer for all featured cards, the round counter (a new round loads 6 new regions)
  // and the regions shown last, so the next set is different
  const [featuredTick, setFeaturedTick] = useState(0);
  const [featuredPaused, setFeaturedPaused] = useState(false); // paused while the mouse is over any card
  const [featuredRound, setFeaturedRound] = useState(0);
  const lastFeatured = useRef([]);

  // Season dropdown menu
  const [seasonAnchor, setSeasonAnchor] = useState(null);
  const [activeSeason, setActiveSeason] = useState(null);

  // CHANGED: runs on page load and again every time a new round is requested (no page refresh needed)
  useEffect(() => {
    let cancelled = false;

    const loadFeatured = async () => {
      const regions = await getRegions();
      // ADDED: leave out the regions that were just shown, so every round is a different set
      const fresh = regions.filter((region) => !lastFeatured.current.includes(region.name));
      const picks = shuffle(fresh.length >= 6 ? fresh : regions).slice(0, 6);

      const results = await Promise.all(
        picks.map(async (region) => {
          const found = focusPhotos(await searchPhotosByLocation(`${region.name} Philippines`, 40), region.name, false);
          return found.length ? { name: region.name, photos: shuffle(found.slice(0, 12)).slice(0, 5) } : null; // up to 5 photos per region
        })
      );

      if (cancelled) return;

      const loaded = results.filter(Boolean);
      if (loaded.length) {
        lastFeatured.current = loaded.map((item) => item.name);
        setFeatured(loaded);
      }
      setFeaturedTick(0); // start the (new) set from the first photo
    };

    loadFeatured();

    return () => {
      cancelled = true;
    };
  }, [featuredRound]);

  // ADDED: number of photos in one full cycle (the card with the most photos decides)
  const featuredCycle = featured.length ? Math.max(...featured.map((item) => item.photos.length)) : 1;

  // ADDED: every 10 seconds all cards move to their next photo together.
  // After the last photo of the cycle, 6 new random regions (with their photos) are loaded.
  useEffect(() => {
    if (featured.length === 0 || featuredPaused) return undefined;
    const timer = setTimeout(() => {
      if (featuredTick >= featuredCycle - 1) setFeaturedRound((round) => round + 1);
      else setFeaturedTick((tick) => tick + 1);
    }, 10000);
    return () => clearTimeout(timer);
  }, [featured.length, featuredTick, featuredCycle, featuredPaused, featuredRound]);

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

  // TODO 3.8 [Operational Async Glue Engine]: 
  // a. Shift local state property configuration 'loading' to true.
  // b. Fire the async handler function 'searchPhotosByLocation(locationName)' inside an await statement.
  // c. Capture resulting photo dataset arrays inside the local state 'photos'.
  // d. Toggle the operation state status trackers 'loading' back to false inside an executive safety wrapper execution tier.
  // [Your code here]
  //
  // Runs one search for a place + categories. Each category is searched on its own
  // ("La Trinidad Philippines Mountain", "La Trinidad Philippines Beach") and the results are mixed.
  // If a category has nothing in that place, similar spots are recommended instead.
  const runSearch = async (place, categories, strict) => {
    if (!place && categories.length === 0) return;

    const id = ++requestId.current;
    const base = place || 'the Philippines';

    setLoading(true);
    setHasSearched(true);
    setNotices([]);
    setSearchedLocation([place || 'Philippines', categories.join(', ')].filter(Boolean).join(' · '));

    try {
      const groups = await Promise.all(
        (categories.length ? categories : [null]).map((category) => findForCategory(place, category, strict))
      );

      const messages = groups
        .filter((g) => g.missing || (g.loose && g.photos.length)) // ADDED: loose results get a message too
        .map((g) => {
          // ADDED: no category picked and no photo names the place
          if (!g.category) return { severity: 'warning', text: `We couldn't find photos naming ${base}, so here are the closest tourist spots we found for it.` };
          const name = g.category.toLowerCase();
          const start = `There's no tourist ${name} in ${base}`;
          if (g.altLabels) return { severity: 'warning', text: `${start}, but we recommend ${g.altLabels.join(' and ')} in ${base} instead.` };
          // ADDED: last fallback, tourist spots for the place without requiring its name in the caption
          if (g.loose && g.photos.length) return { severity: 'warning', text: `${start}. Here are the closest tourist spots we found for ${base} instead.` };
          if (g.general && g.photos.length) return { severity: 'warning', text: `${start}. We recommend these other tourist spots in ${base} instead.` };
          if (g.spots?.length) return { severity: 'warning', text: `${start}. We recommend these ${name} destinations instead: ${g.spots.join(', ')}.` };
          return { severity: 'warning', text: `${start}.` };
        });

      // Take one photo from each category in turn so every selected category shows up
      const merged = [];
      const seen = new Set();
      const longest = Math.max(...groups.map((g) => g.photos.length));
      for (let i = 0; i < longest; i += 1) {
        groups.forEach((g) => {
          const photo = g.photos[i];
          if (photo && !seen.has(photo.id)) {
            seen.add(photo.id);
            merged.push(photo);
          }
        });
      }

      let results = merged.slice(0, 60);

      if (results.length === 0 && messages.length === 0) {
        messages.push({ severity: 'warning', text: `We couldn't find photos for ${base} yet. Try another city or municipality.` });
      }

      if (id !== requestId.current) return;
      setPhotos(results);
      setNotices(messages);
    } catch (error) {
      console.error('Search failed:', error);
      if (id === requestId.current) setPhotos([]);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  };

  // Called by the form (city) and the featured tiles (region). Selected categories still apply.
  const handleSearchSubmit = (locationName, strict = true) => {
    // Scroll up so the results are visible when a featured item is clicked
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSeasonSpot('');
    setLocation(locationName);
    setStrictPlace(strict);
    runSearch(locationName, selectedCategories, strict);
  };

  // Season picks are NOT combined with the categories: they are searched on their own
  const handleSeasonSpot = (spot) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSeasonSpot(spot);
    setSelectedCategories([]);
    runSearch(spot, [], false);
  };

  const resetResults = () => {
    requestId.current += 1;
    setPhotos([]);
    setHasSearched(false);
    setNotices([]);
    setLoading(false);
  };

  const updateCategories = (next) => {
    setSeasonSpot('');
    setSelectedCategories(next);
    if (next.length === 0 && !location) resetResults();
    else runSearch(location, next, strictPlace);
  };

  const toggleCategory = (label) =>
    updateCategories(
      selectedCategories.includes(label)
        ? selectedCategories.filter((c) => c !== label)
        : [...selectedCategories, label]
    );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Top bar with the app name */}
      <AppBar position="absolute" color="transparent" elevation={0} sx={{ color: '#fff' }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TravelExplore />
            <Typography variant="h6" fontWeight={700}>
              Lakbay PH
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Dark/light toggle: fixed, so it stays in place while scrolling */}
      <Tooltip title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
        <IconButton
          onClick={() => setIsDarkMode(!isDarkMode)}
          aria-label="toggle theme"
          sx={{
            position: 'fixed',
            top: 12,
            right: 16,
            zIndex: (t) => t.zIndex.appBar + 1,
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: 4,
            '&:hover': { bgcolor: 'background.paper' },
          }}
        >
          {isDarkMode ? <LightMode /> : <DarkMode />}
        </IconButton>
      </Tooltip>

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

          {/* Quick filters: categories (multi-select) + best time to go */}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 3, mb: 1, textAlign: 'center' }}>
            Browse by category (pick one or more)
          </Typography>
          <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' } }}>
            {CATEGORIES.map(({ label, Icon }) => {
              const selected = selectedCategories.includes(label);
              return (
                <Button
                  key={label}
                  variant={selected ? 'contained' : 'outlined'}
                  color="primary"
                  size="small"
                  startIcon={<Icon />}
                  aria-pressed={selected}
                  onClick={() => toggleCategory(label)}
                  sx={buttonFitSx}
                >
                  {label}
                </Button>
              );
            })}
          </Box>
          {selectedCategories.length > 0 && (
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Button size="small" onClick={() => updateCategories([])}>
                Clear categories
              </Button>
            </Box>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1, textAlign: 'center' }}>
            Best time to go
          </Typography>
          <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' } }}>
            {SEASONS.map((season) => {
              const active = season.spots.includes(seasonSpot);
              return (
                <Button
                  key={season.label}
                  variant={active ? 'contained' : 'outlined'}
                  color="secondary"
                  size="small"
                  startIcon={<season.Icon />}
                  endIcon={<ExpandMore />}
                  aria-pressed={active}
                  onClick={(e) => {
                    setActiveSeason(season);
                    setSeasonAnchor(e.currentTarget);
                  }}
                  sx={[buttonFitSx, !active && { color: 'text.primary' }]}
                >
                  {season.label}
                </Button>
              );
            })}
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
                selected={seasonSpot === spot}
                onClick={() => {
                  setSeasonAnchor(null);
                  handleSeasonSpot(spot);
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
        {!loading && notices.length > 0 && (
          <Stack spacing={1} sx={{ mb: 3 }}>
            {notices.map((notice) => (
              <Alert key={notice.text} severity={notice.severity}>
                {notice.text}
              </Alert>
            ))}
          </Stack>
        )}

        {/* Connect presentation display layout nodes passing state parameters downstream */}
        <MediaGallery
          photos={photos}
          loading={loading}
          hasSearched={hasSearched}
          locationName={searchedLocation}
        />
      </Container>

      {/* Featured destinations (random regions): each card is its own carousel, all moving together */}
      <Container maxWidth="lg" sx={{ pb: 8 }}>
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
          {featured.map(({ name, photos: regionPhotos }) => (
            <FeaturedCard
              key={name}
              name={name}
              photos={regionPhotos}
              tick={featuredTick}
              onPause={setFeaturedPaused}
              active={location === name}
              onSelect={() => handleSearchSubmit(name, false)}
            />
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