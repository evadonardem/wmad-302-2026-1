import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Container,CssBaseline,ThemeProvider,createTheme,Typography,Box,IconButton,Paper,Tooltip,Link,Button,Menu,MenuItem,Stack,Alert,Divider,alpha,useMediaQuery, useTheme, } from '@mui/material';
import {LightMode,DarkMode,Terrain,BeachAccess,Waves,WaterDrop,Church,Forest,WbSunny,Umbrella,AcUnit,ExpandMore,ChevronLeft,  ChevronRight, } from '@mui/icons-material';
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

// ADDED: searches used for the photo carousel at the top of the page (Philippine tourist spots only)
const HERO_QUERIES = [
  'Philippines beach',
  'Philippines mountain',
  'Philippines island',
  'Philippines rice terraces',
  'Philippines waterfall',
  'Philippines landscape',
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

const PH_RE = /philippin|filipin|pinoy|pilipinas/;
const norm = (s) =>
  s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\bmt\b/g, 'mount').replace(/\s+/g, ' ').trim();
const placeCore = (name) =>
  norm(name.replace(/\(.*?\)/g, '').replace(/^(island garden city of|city of|municipality of)\s+/i, '').replace(/\s+city$/i, ''));
const photoText = (p) => ` ${norm(`${p.altText || ''} ${(p.sourceUrl || '').split('/photo/')[1] || ''}`)} `;

const focusPhotos = (photos, place, strict) => {
  if (strict && place) {
    const core = ` ${placeCore(place)} `;
    return photos.filter((p) => photoText(p).includes(core));
  }
  const ph = photos.filter((p) => PH_RE.test(photoText(p)));
  return ph.length >= 4 ? ph : [...ph, ...photos.filter((p) => !ph.includes(p))];
};

const matchesTerm = (photo, term) => {
  const words = TERM_WORDS[term] || [norm(term)];
  const tokens = new Set(photoText(photo).trim().split(' '));
  return words.some((w) => tokens.has(w) || tokens.has(`${w}s`) || tokens.has(`${w}es`));
};

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
  const find = async (term, strictMode = strict) => {
    const query = [place, 'Philippines', term].filter(Boolean).join(' ');
    const found = focusPhotos(await searchPhotosByLocation(query), place, strictMode); 
    return (term ? found.filter((p) => matchesTerm(p, term)) : found).slice(0, 30);
  };
  const tag = (photos, recommended = null) =>
    photos.map((p) => ({ ...p, location: place || 'Philippines', category, recommended }));

  if (!category) {
    const all = await find('');
    if (all.length || !place) return { category, photos: tag(all) };
    return { category, loose: true, photos: tag(await find('', false), 'tourist spot') };
  }

  const direct = await find(category.toLowerCase());
  if (direct.length) return { category, photos: tag(direct) };

  if (!place) {
    const rec = await findSpots(RECOMMENDED[category], category, `${category.toLowerCase()} destination`);
    return { category, missing: true, spots: rec.names, photos: rec.photos };
  }

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

  const general = await find('');
  if (general.length) return { category, missing: true, general: true, photos: tag(general, 'tourist spot') };

  const loose = await find('', false);
  return { category, missing: true, general: true, loose: true, photos: tag(loose, 'tourist spot') };
};

const searchCardSx = {
  position: 'relative',
  overflow: 'hidden',
  p: { xs: 2.5, sm: 4 },
  borderRadius: '24px',
  color: '#fff',
  background: 'linear-gradient(145deg, #0B7A75 0%, #09635F 55%, #064A47 100%)',
  border: 1,
  borderColor: 'rgba(255,255,255,0.18)',
  boxShadow: '0 0 0 8px rgba(255,255,255,0.35), 0 30px 70px rgba(6,40,45,0.5), 0 6px 18px rgba(0,0,0,0.2)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: 'linear-gradient(90deg, #F4B63F, #FFD98A, #F4B63F)',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: -120,
    right: -120,
    width: 320,
    height: 320,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(244,182,63,0.28), transparent 65%)',
    pointerEvents: 'none',
  },
  // the form from LocationForm, restyled for the dark card
  '& .MuiOutlinedInput-root': {
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.1)',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.8)' },
    '&.Mui-focused fieldset': { borderColor: '#F4B63F' },
    '&.Mui-disabled': {
      backgroundColor: 'rgba(255,255,255,0.05)',
      '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255,255,255,0.8)',
    '&.Mui-focused': { color: '#F4B63F' },
    '&.Mui-disabled': { color: 'rgba(255,255,255,0.45)' },
  },
  '& .MuiSelect-select.Mui-disabled': { WebkitTextFillColor: 'rgba(255,255,255,0.5)' },
  '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.85)' },
  '& .MuiInputAdornment-root .MuiSvgIcon-root': { color: '#F4B63F' },
  '& .Mui-disabled .MuiInputAdornment-root .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.35)' },
  '& .MuiFormHelperText-root': { color: 'rgba(255,255,255,0.8)' },
  '& button[type="submit"]': {
    bgcolor: '#F4B63F',
    color: '#1B2A2E',
    boxShadow: 3,
    '&:hover': { bgcolor: '#FFC95C' },
    '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.45)' },
  },
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

const HERO_SPOT_MS = 1000; 
const HERO_FULL_MS = 7000; 
const HERO_BACK_MS = 1200; 

function HeroCarousel({ photos }) {
  const theme = useTheme();
  const isMd = useMediaQuery(theme.breakpoints.up('md'));
  const boxRef = useRef(null);
  const [boxW, setBoxW] = useState(1200);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('spot');
  const [paused, setPaused] = useState(false);
  const count = photos.length;

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const measure = () => setBoxW(el.clientWidth || 1200);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const boxH = isMd ? 520 : 340;
  const spotW = isMd ? Math.min(boxW * 0.56, 820) : boxW * 0.78;
  const spotH = isMd ? 340 : 200;
  const spotTop = isMd ? 32 : 24;
  const gap = isMd ? 1.04 : 0.82; 

  const go = (step) => {
    setIndex((i) => (i + step + count) % count);
    setPhase('spot');
  };

  useEffect(() => {
    if (count === 0 || paused) return undefined;
    const delay = phase === 'spot' ? HERO_SPOT_MS : phase === 'full' ? HERO_FULL_MS : HERO_BACK_MS;
    const timer = setTimeout(() => {
      if (phase === 'spot') setPhase('full');
      else if (phase === 'full') setPhase('back');
      else {
        if (count > 1) setIndex((i) => (i + 1) % count);
        setPhase('spot');
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [count, phase, index, paused]);

  const offsetOf = (i) => {
    let o = (i - index + count) % count;
    if (o > count / 2) o -= count;
    return Math.max(-2, Math.min(2, o));
  };

  const arrowSx = {
    position: 'absolute',
    top: { xs: 124, md: 202 }, 
    transform: 'translateY(-50%)',
    zIndex: 3,
    width: 46,
    height: 46,
    color: '#fff',
    bgcolor: 'rgba(255,255,255,0.18)',
    border: '1px solid rgba(255,255,255,0.4)',
    backdropFilter: 'blur(8px)',
    opacity: { xs: 1, md: 0 }, 
    transition: 'opacity 0.3s ease, background-color 0.3s ease',
    '&:hover': { bgcolor: 'rgba(255,255,255,0.32)' },
  };

  return (
    <Box
      ref={boxRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        isolation: 'isolate', 
        height: boxH,

        background: (t) =>
          t.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #0A2E33 0%, #0E1A1F 100%)'
            : 'linear-gradient(135deg, #0B7A75 0%, #2BB3A8 60%, #F4B63F 150%)',
        '&:hover .hero-arrow': { opacity: 1 },
      }}
    >
      {photos.map((p, i) => (
        <Box
          key={`bg-${p.id}`}
          component="img"
          src={p.highResUrl || p.imageUrl}
          alt=""
          aria-hidden="true"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(30px) brightness(0.5) saturate(1.3)',
            transform: 'scale(1.3)',
            opacity: i === index ? 1 : 0,
            transition: 'opacity 1.2s ease',
          }}
        />
      ))}

      {/* Light cone from the top, shining on the centre photo */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 85% at 50% 0%, rgba(255,244,214,0.3) 0%, rgba(255,244,214,0) 70%)',
        }}
      />

      {/* The photos: centre one big and lit (it grows to the whole header), the others smaller and dimmed on the sides */}
      {photos.map((p, i) => {
        const off = offsetOf(i);
        const isCur = off === 0;
        const full = isCur && phase === 'full';
        const visible = Math.abs(off) <= 1;

        return (
          <Box
            key={p.id}
            onClick={() => !isCur && visible && go(off)}
            sx={{
              position: 'absolute',
              left: '50%',
              top: full ? 0 : spotTop,
              width: full ? boxW : spotW,
              height: full ? boxH : spotH,
              borderRadius: full ? 0 : '20px',
              overflow: 'hidden',
              cursor: isCur ? 'default' : 'pointer',
              zIndex: isCur ? 2 : 1,
              opacity: isCur ? 1 : visible && phase !== 'full' ? 0.6 : 0,
              pointerEvents: visible ? 'auto' : 'none',
              transform: `translateX(calc(-50% + ${off * gap * spotW}px)) scale(${isCur ? 1 : 0.8})`,
              filter: isCur ? 'none' : 'brightness(0.55)',
              boxShadow: full
                ? '0 0 0 0 rgba(0,0,0,0)'
                : isCur
                  ? '0 25px 60px rgba(0,0,0,0.55), 0 0 0 3px rgba(255,255,255,0.85), 0 0 70px rgba(244,182,63,0.4)'
                  : '0 10px 30px rgba(0,0,0,0.35)',
              transition:
                'transform 0.9s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.9s ease, filter 0.9s ease, box-shadow 0.9s ease, top 0.9s cubic-bezier(0.22, 1, 0.36, 1), width 0.9s cubic-bezier(0.22, 1, 0.36, 1), height 0.9s cubic-bezier(0.22, 1, 0.36, 1), border-radius 0.9s ease',
            }}
          >
            <Box
              component="img"
              src={p.highResUrl || p.imageUrl}
              alt={p.altText || 'Philippine tourist spot'}
              decoding="async"
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </Box>
        );
      })}

      {/* soft shading: darker at the top and bottom, light vignette on the sides */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 2,
          background:
            'linear-gradient(to bottom, rgba(4,14,18,0.35) 0%, rgba(4,14,18,0) 25%, rgba(4,14,18,0) 55%, rgba(4,14,18,0.45) 100%), radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.3) 100%)',
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          top: { xs: 124, md: 202 }, 
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 4,
          width: { xs: '86%', md: 'min(72%, 760px)' },
          textAlign: 'center',
          color: '#fff',
          pointerEvents: 'none',
          opacity: phase === 'full' ? 0.0 : 1, 
          transition: 'opacity 0.9s ease',
          '@keyframes brandRise': { from: { opacity: 0, transform: 'translate(-50%, -42%)' }, to: { opacity: 1, transform: 'translate(-50%, -50%)' } },
          animation: 'brandRise 1.1s cubic-bezier(0.22, 1, 0.36, 1) both',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: { xs: '-18px -10px', md: '-34px -40px' },
            zIndex: -1,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(4,20,24,0.62) 0%, rgba(4,20,24,0.38) 50%, rgba(4,20,24,0) 72%)',
            filter: 'blur(6px)',
          },
        }}
      >
        <Typography
          component="div"
          sx={{
            fontFamily: '"Fraunces", Georgia, serif',
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: { xs: '0.08em', md: '0.12em' },
            fontSize: { xs: '2.1rem', sm: '3rem', md: '4.6rem' },
            textShadow: '0 4px 24px rgba(0,0,0,0.55)',
          }}
        >
          PH{' '}
          <Box
            component="span"
            sx={{
              background: 'linear-gradient(90deg, #FFD98A 0%, #F4B63F 50%, #FFE7B0 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              textShadow: 'none',
              filter: 'drop-shadow(0 3px 14px rgba(0,0,0,0.5))',
            }}
          >
            NAVYRA
          </Box>
        </Typography>

        {/* gold divider with a small diamond in the middle */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.25, my: { xs: 1, md: 1.75 } }}>
          <Box sx={{ height: 2, width: { xs: 44, md: 96 }, borderRadius: 1, background: 'linear-gradient(90deg, transparent, #F4B63F)' }} />
          <Box sx={{ width: { xs: 7, md: 10 }, height: { xs: 7, md: 10 }, transform: 'rotate(45deg)', bgcolor: '#F4B63F', boxShadow: '0 0 14px rgba(244,182,63,0.9)' }} />
          <Box sx={{ height: 2, width: { xs: 44, md: 96 }, borderRadius: 1, background: 'linear-gradient(90deg, #F4B63F, transparent)' }} />
        </Box>

        <Typography
          component="div"
          sx={{
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: { xs: '0.14em', md: '0.26em' },
            fontSize: { xs: '0.6rem', sm: '0.72rem', md: '0.92rem' },
            lineHeight: 1.7,
            textShadow: '0 2px 12px rgba(0,0,0,0.7)',
          }}
        >
          Nature, Attractions, Visuals
          <Box component="span" sx={{ display: 'block', color: '#FFD98A' }}>
            Your Regional Adventure
          </Box>
        </Typography>
      </Box>

      {count > 1 && (
        <>
          <IconButton className="hero-arrow" aria-label="previous photo" onClick={() => go(-1)} sx={{ ...arrowSx, left: { xs: 10, md: 28 } }}>
            <ChevronLeft />
          </IconButton>
          <IconButton className="hero-arrow" aria-label="next photo" onClick={() => go(1)} sx={{ ...arrowSx, right: { xs: 10, md: 28 } }}>
            <ChevronRight />
          </IconButton>
        </>
      )}

      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          left: 0,
          bottom: -1,
          width: '100%',
          height: { xs: 64, md: 124 },
          pointerEvents: 'none',
          zIndex: 3,
          overflow: 'hidden',
          '@keyframes waveDriftA': { from: { transform: 'translateX(-3%)' }, to: { transform: 'translateX(3%)' } },
          '@keyframes waveDriftB': { from: { transform: 'translateX(3%)' }, to: { transform: 'translateX(-3%)' } },
          '& svg': { position: 'absolute', left: '-5%', bottom: 0, width: '110%', height: '100%', display: 'block' },
          '@media (prefers-reduced-motion: reduce)': { '& svg': { animation: 'none !important' } },
        }}
      >
        {/* back wave: gold */}
        <Box component="svg" viewBox="0 0 1440 120" preserveAspectRatio="none" sx={{ animation: 'waveDriftA 9s ease-in-out infinite alternate' }}>
          <path d="M0,70 C200,20 420,20 640,58 C860,96 1080,100 1260,56 C1350,34 1410,30 1440,36 L1440,120 L0,120 Z" fill="#F4B63F" fillOpacity="0.55" />
        </Box>
        {/* middle wave: teal */}
        <Box component="svg" viewBox="0 0 1440 120" preserveAspectRatio="none" sx={{ animation: 'waveDriftB 12s ease-in-out infinite alternate' }}>
          <path d="M0,80 C180,110 380,110 600,80 C820,50 1040,20 1240,48 C1330,60 1400,84 1440,78 L1440,120 L0,120 Z" fill="#2BB3A8" fillOpacity="0.6" />
        </Box>
        {/* front wave: same colour as the page, so the header flows straight into the body */}
        <Box component="svg" viewBox="0 0 1440 120" preserveAspectRatio="none" sx={{ '&&': { left: 0, width: '100%' } }}>
          <Box
            component="path"
            d="M0,78 C180,118 360,118 560,92 C780,62 960,22 1160,50 C1290,68 1380,92 1440,82 L1440,120 L0,120 Z"
            sx={{ fill: (t) => t.palette.background.default }}
          />
        </Box>
      </Box>
    </Box>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h4" component="h2" sx={{ fontSize: { xs: '1.6rem', md: '2rem' } }}>
        {title}
      </Typography>
      <Box sx={{ width: 72, height: 5, borderRadius: 3, mt: 1, background: 'linear-gradient(90deg, #0B7A75, #F4B63F)', boxShadow: '0 4px 14px rgba(244,182,63,0.45)' }} />
      {subtitle && (
        <Typography color="text.secondary" sx={{ mt: 1.5 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

function FeaturedCard({ name, photos, tick, onPause, active, onSelect }) {
  const [offset, setOffset] = useState(0); 

  const count = photos.length;
  const index = (((tick + offset) % count) + count) % count;

  const go = (e, step) => {
    e.stopPropagation(); 
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
        borderRadius: '14px',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: (t) => (t.palette.mode === 'dark' ? '0 8px 24px rgba(0,0,0,0.4)' : '0 10px 28px rgba(11,122,117,0.18)'),
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': { transform: 'translateY(-4px)' },
        outline: (t) => (active ? `3px solid ${t.palette.primary.main}` : 'none'),
        outlineOffset: 2,
        '&:hover img': { transform: 'scale(1.06)' },
        '&:hover .card-arrow': { opacity: 1 },
      }}
    >
    
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
  const [strictPlace, setStrictPlace] = useState(true); 
  const [seasonSpot, setSeasonSpot] = useState(''); 
  const [notices, setNotices] = useState([]); 
  const requestId = useRef(0); 

  const [featured, setFeatured] = useState([]);

  const [heroPhotos, setHeroPhotos] = useState([]);

  const [featuredTick, setFeaturedTick] = useState(0);
  const [featuredPaused, setFeaturedPaused] = useState(false); 
  const [featuredRound, setFeaturedRound] = useState(0);
  const lastFeatured = useRef([]);

  // Season dropdown menu
  const [seasonAnchor, setSeasonAnchor] = useState(null);
  const [activeSeason, setActiveSeason] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadHero = async () => {
      const lists = await Promise.all(
        HERO_QUERIES.map(async (query) => {
          const found = await searchPhotosByLocation(query, 30);
          return found.filter((p) => (p.width ? p.width >= 3000 && p.width > p.height : true));
        })
      );

      const philippine = lists.flatMap((list) => list.filter((p) => PH_RE.test(photoText(p))).slice(0, 2));
      const chosen = philippine.length >= 3 ? philippine : focusPhotos(lists.flat(), null, false).slice(0, 8);

      const unique = [...new Map(chosen.map((p) => [p.id, p])).values()];
      if (!cancelled) setHeroPhotos(shuffle(unique).slice(0, 8));
    };

    loadHero();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadFeatured = async () => {
      const regions = await getRegions();
    
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
      setFeaturedTick(0); 
    };

    loadFeatured();

    return () => {
      cancelled = true;
    };
  }, [featuredRound]);

  const featuredCycle = featured.length ? Math.max(...featured.map((item) => item.photos.length)) : 1;

  useEffect(() => {
    if (featured.length === 0 || featuredPaused) return undefined;
    const timer = setTimeout(() => {
      if (featuredTick >= featuredCycle - 1) setFeaturedRound((round) => round + 1);
      else setFeaturedTick((tick) => tick + 1);
    }, 10000);
    return () => clearTimeout(timer);
  }, [featured.length, featuredTick, featuredCycle, featuredPaused, featuredRound]);

  useEffect(() => {
    document.title = 'PH NAVYRA | Nature, Attractions, Visuals - Your Regional Adventure';
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
          MuiOutlinedInput: {
            styleOverrides: {
              root: ({ theme: t }) => ({
                borderRadius: 14,
                backgroundColor: alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.08 : 0.04),
              }),
            },
          },
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
        .filter((g) => g.missing || (g.loose && g.photos.length)) 
        .map((g) => {
          if (!g.category) return { severity: 'warning', text: `We couldn't find photos naming ${base}, so here are the closest tourist spots we found for it.` };
          const name = g.category.toLowerCase();
          const start = `There's no tourist ${name} in ${base}`;
          if (g.altLabels) return { severity: 'warning', text: `${start}, but we recommend ${g.altLabels.join(' and ')} in ${base} instead.` };
          if (g.loose && g.photos.length) return { severity: 'warning', text: `${start}. Here are the closest tourist spots we found for ${base} instead.` };
          if (g.general && g.photos.length) return { severity: 'warning', text: `${start}. We recommend these other tourist spots in ${base} instead.` };
          if (g.spots?.length) return { severity: 'warning', text: `${start}. We recommend these ${name} destinations instead: ${g.spots.join(', ')}.` };
          return { severity: 'warning', text: `${start}.` };
        });

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

      if (place && merged.length > 0 && merged.length <= 9) {
        const extra = await findForCategory(place, '', false);
        extra.photos.forEach((photo) => {
          if (!seen.has(photo.id)) {
            seen.add(photo.id);
            merged.push({ ...photo, recommended: photo.recommended || 'tourist spot' });
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

      <HeroCarousel photos={heroPhotos} />

      <Container maxWidth="md" sx={{ mt: { xs: -10, md: -14 }, position: 'relative', zIndex: 5 }}>
        <Paper elevation={0} sx={searchCardSx}>
          <Typography variant="h5" component="h2" sx={{ textAlign: 'center' }}>
            Where do you want to go?
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, mb: 3, textAlign: 'center', color: 'rgba(255,255,255,0.85)' }}>
            Pick a place, then narrow it down by the kind of trip.
          </Typography>

          {/* Connect the location selection input modules */}
          <LocationForm onSearch={handleSearchSubmit} />

          {/* Quick filters: categories (multi-select) + best time to go */}
          <Divider sx={{ mt: 3, mb: 2, '&::before, &::after': { borderColor: 'rgba(255,255,255,0.25)' } }}>
            <Typography variant="overline" sx={{ letterSpacing: '0.12em', color: 'rgba(255,255,255,0.85)' }}>
              Browse by category · pick one or more
            </Typography>
          </Divider>
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
                  sx={[
                    buttonFitSx,
                    selected
                      ? { bgcolor: '#fff', color: '#0B7A75', boxShadow: 3, '&:hover': { bgcolor: '#fff' } }
                      : { color: '#fff', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.12)' } },
                  ]}
                >
                  {label}
                </Button>
              );
            })}
          </Box>
          {selectedCategories.length > 0 && (
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Button size="small" onClick={() => updateCategories([])} sx={{ color: '#fff' }}>
                Clear categories
              </Button>
            </Box>
          )}

          <Divider sx={{ mt: 3, mb: 2, '&::before, &::after': { borderColor: 'rgba(255,255,255,0.25)' } }}>
            <Typography variant="overline" sx={{ letterSpacing: '0.12em', color: 'rgba(255,255,255,0.85)' }}>
              Best time to go
            </Typography>
          </Divider>
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
                  sx={[
                    buttonFitSx,
                    !active && { color: '#fff', borderColor: 'rgba(244,182,63,0.7)', '&:hover': { borderColor: '#F4B63F', bgcolor: 'rgba(244,182,63,0.15)' } },
                  ]}
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

      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          background: (t) =>
            t.palette.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(77,208,200,0) 0%, rgba(77,208,200,0.07) 35%, rgba(244,182,63,0.05) 70%, rgba(77,208,200,0.08) 100%)'
              : 'linear-gradient(180deg, rgba(43,179,168,0) 0%, rgba(43,179,168,0.10) 35%, rgba(244,182,63,0.09) 70%, rgba(43,179,168,0.12) 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage: (t) => {
              const stroke = t.palette.mode === 'dark' ? '%234DD0C8' : '%230B7A75';
              return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='48' viewBox='0 0 160 48'%3E%3Cpath d='M0 24 Q20 6 40 24 T80 24 T120 24 T160 24' fill='none' stroke='${stroke}' stroke-opacity='0.13' stroke-width='1.6'/%3E%3C/svg%3E")`;
            },
            backgroundSize: '160px 48px',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, #000 30%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0) 100%)',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, #000 30%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0) 100%)',
          },
        }}
      >
        <Box
          aria-hidden="true"
          sx={{ position: 'absolute', top: 120, left: -180, width: 460, height: 460, borderRadius: '50%', bgcolor: (t) => alpha(t.palette.primary.main, 0.1), filter: 'blur(70px)', pointerEvents: 'none' }}
        />
        <Box
          aria-hidden="true"
          sx={{ position: 'absolute', bottom: 160, right: -180, width: 460, height: 460, borderRadius: '50%', bgcolor: (t) => alpha(t.palette.secondary.main, 0.12), filter: 'blur(70px)', pointerEvents: 'none' }}
        />

        <Container
          maxWidth="lg"
          sx={{
            position: 'relative',
            zIndex: 1,
            py: { xs: 4, md: 6 },
            px: { xs: 2, md: 5 },
            my: 6,
            minHeight: '40vh',
            borderRadius: '32px',
            border: 1,
            borderColor: (t) => alpha(t.palette.primary.main, 0.18),
            bgcolor: (t) => alpha(t.palette.background.paper, t.palette.mode === 'dark' ? 0.6 : 0.78),
            backdropFilter: 'blur(10px)',
            boxShadow: (t) => `0 24px 60px ${alpha(t.palette.primary.main, 0.12)}`,
          }}
        >
          {!loading && notices.length > 0 && (
            <Stack spacing={1} sx={{ mb: 3 }}>
              {notices.map((notice) => (
                <Alert key={notice.text} severity={notice.severity} sx={{ borderRadius: '14px' }}>
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
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            pt: 6,
            background: (t) =>
              `linear-gradient(180deg, ${alpha(t.palette.primary.main, 0)} 0%, ${alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.1 : 0.08)} 100%)`,
            borderTop: 1,
            borderColor: (t) => alpha(t.palette.primary.main, 0.12),
          }}
        >
          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pb: 8 }}>
            <SectionTitle
              title="Featured destinations"
              subtitle="Regions picked at random. Tap one to explore its tourist spots."
            />
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
        </Box>

        {/* Footer with Pexels credit */}
        <Box component="footer" sx={{ position: 'relative', zIndex: 1, py: 5, textAlign: 'center', color: 'text.secondary' }}>
          <Box sx={{ width: 'min(240px, 60%)', height: 2, mx: 'auto', mb: 3, background: 'linear-gradient(90deg, transparent, #2BB3A8, #F4B63F, transparent)' }} />
          <Typography sx={{ fontFamily: '"Fraunces", Georgia, serif', fontWeight: 800, fontSize: '1.3rem', color: 'text.primary' }}>
            🇵🇭 PH NAVYRA
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.25, fontStyle: 'italic' }}>
            Nature, Attractions, Visuals - Your Regional Adventure
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Photos provided by{' '}
            <Link href="https://www.pexels.com" target="_blank" rel="noopener noreferrer">
              Pexels
            </Link>{' '}
            · Location data from PSGC
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}