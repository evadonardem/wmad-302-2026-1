import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardMedia, CardContent, Typography, Link, Skeleton,
  IconButton, Dialog, Tabs, Tab, Button, Tooltip,
} from '@mui/material';
import {
  Favorite, FavoriteBorder, PhotoCamera, ChevronLeft, ChevronRight, Close, Directions, Place,
} from '@mui/icons-material';

// How many photos show at first, and how many more each "Load more" click adds
const PAGE_SIZE = 6;

// Round translucent buttons used on top of the big photo
const overlayButton = {
  bgcolor: 'rgba(0,0,0,0.45)',
  color: '#fff',
  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
};

// Round white buttons floating on the card photos
const floatingButton = {
  width: 44,
  height: 44,
  bgcolor: '#fff',
  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  '&:hover': { bgcolor: '#f4f4f4' },
};

// The place name shown on each card (App.jsx saves it on every photo)
const placeOf = (photo) => photo.place || 'Philippines';

// Calligraphy font for the place name (loaded from Google Fonts below)
const CALLIGRAPHY_FONT = '"Great Vibes", "Brush Script MT", cursive';

// Google Maps link: opens the place, with a Directions button right there
const mapsUrl = (place) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    place === 'Philippines' ? 'Philippines' : `${place}, Philippines`
  )}`;

export default function MediaGallery({ photos, loading }) {
  // Which list is showing: 'results' or 'favorites'
  const [view, setView] = useState('results');

  // The photo currently opened in the big view (null = closed)
  const [selected, setSelected] = useState(null);

  // How many cards are visible right now (for "Load more")
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Load the calligraphy font once (falls back to a cursive font if offline)
  useEffect(() => {
    const id = 'great-vibes-font';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap';
    document.head.appendChild(link);
  }, []);

  // Favorites: full photo objects, remembered even after refresh
  const [liked, setLiked] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('favoritePhotos')) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('favoritePhotos', JSON.stringify(liked));
    } catch {
      // ignore storage errors
    }
  }, [liked]);

  // Start from the first page again whenever a new search comes in or the tab changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [photos, view]);

  // Load the calligraphy font (Great Vibes) once
  useEffect(() => {
    const id = 'great-vibes-font';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap';
    document.head.appendChild(link);
  }, []);

  const toggleLike = (photo) => {
    setLiked((prev) =>
      prev.some((p) => p.id === photo.id)
        ? prev.filter((p) => p.id !== photo.id)
        : [...prev, photo]
    );
  };

  const showingFavorites = view === 'favorites';
  const list = showingFavorites ? liked : photos;
  const visible = (list || []).slice(0, visibleCount);

  // ---- Big view navigation (Previous / Next) ----
  const selectedIndex = selected && list ? list.findIndex((p) => p.id === selected.id) : -1;
  const canNavigate = selectedIndex >= 0 && list.length > 1;

  // step = 1 (next) or -1 (previous); wraps around at the ends
  const goTo = (step) => {
    if (!canNavigate) return;
    const nextIndex = (selectedIndex + step + list.length) % list.length;
    setSelected(list[nextIndex]);
  };

  // Keyboard: left / right arrows, and preload the neighbouring photos so switching feels instant
  useEffect(() => {
    if (!selected || !canNavigate) return undefined;

    const onKey = (e) => {
      if (e.key === 'ArrowRight') goTo(1);
      if (e.key === 'ArrowLeft') goTo(-1);
    };
    window.addEventListener('keydown', onKey);

    [1, -1].forEach((step) => {
      const neighbour = list[(selectedIndex + step + list.length) % list.length];
      if (neighbour) new Image().src = neighbour.imageUrl;
    });

    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, list]);

  let content;

  if (loading && !showingFavorites) {
    // TODO 3.1 [Loading Skeletal Feedbacks]
    content = (
      <Grid container spacing={3}>
        {Array.from({ length: PAGE_SIZE }).map((_, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card elevation={0} sx={{ borderRadius: 3 }}>
              <Skeleton variant="rectangular" height={210} />
              <CardContent>
                <Skeleton width="60%" height={30} />
                <Skeleton width="45%" />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  } else if (!list || list.length === 0) {
    // TODO 3.2 [Boundary Validation Checks]
    content = (
      <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
        {showingFavorites ? (
          <FavoriteBorder sx={{ fontSize: 48, mb: 1 }} />
        ) : (
          <PhotoCamera sx={{ fontSize: 48, mb: 1 }} />
        )}
        <Typography variant="h6">
          {showingFavorites
            ? 'No favorites yet. Tap the heart on a photo to save it here.'
            : 'No tourist spots found for this area yet. Try another city or a quick search above.'}
        </Typography>
      </Box>
    );
  } else {
    content = (
      <>
        {/* TODO 3.3 [Fluid Layout Architecture] */}
        <Grid container spacing={3}>
          {/* TODO 3.4 [Card Content Loop Mapping] */}
          {visible.map((photo) => {
            const isLiked = liked.some((p) => p.id === photo.id);
            const place = placeOf(photo);
            return (
              <Grid key={photo.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    overflow: 'visible',
                    boxShadow: '0 2px 10px rgba(60, 40, 20, 0.12)',
                    transition: 'transform 0.25s, box-shadow 0.25s',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: '0 12px 26px rgba(60, 40, 20, 0.25)',
                    },
                    '&:hover img': { transform: 'scale(1.06)' },
                  }}
                >
                  {/* Photo with the buttons floating on it */}
                  <Box sx={{ position: 'relative' }}>
                    {/* TODO 3.5 [Multimedia Presentation Layer] */}
                    <Box sx={{ overflow: 'hidden', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
                      <CardMedia
                        component="img"
                        height="210"
                        image={photo.imageUrl}
                        alt={photo.altText}
                        loading="lazy"
                        onClick={() => setSelected(photo)}
                        sx={{ cursor: 'zoom-in', transition: 'transform 0.4s ease', display: 'block' }}
                      />
                    </Box>

                    {/* Soft shade at the bottom of the photo so the calligraphy name stays readable */}
                    <Box
                      aria-hidden
                      sx={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: 70,
                        pointerEvents: 'none',
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.35))',
                      }}
                    />

                    {/* Name of the place in calligraphy, bottom left of the photo (kept subtle) */}
                    <Typography
                      component="span"
                      aria-hidden
                      sx={{
                        position: 'absolute',
                        left: 16,
                        bottom: 10,
                        zIndex: 1,
                        maxWidth: 'calc(100% - 90px)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        fontFamily: '"Great Vibes", "Brush Script MT", cursive',
                        fontSize: '2rem',
                        lineHeight: 1.1,
                        color: 'rgba(255,255,255,0.8)', // lower the 0.8 to make it fainter
                        textShadow: '0 1px 6px rgba(0,0,0,0.5)',
                      }}
                    >
                      {place}
                    </Typography>

                    {/* Google Maps button: top right of the photo */}
                    <Tooltip title="Open in Google Maps">
                      <IconButton
                        component="a"
                        href={mapsUrl(place)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${place} in Google Maps`}
                        sx={{ ...floatingButton, width: 40, height: 40, position: 'absolute', top: 10, right: 10, color: 'primary.dark' }}
                      >
                        <Directions />
                      </IconButton>
                    </Tooltip>

                    {/* Heart: bottom right of the photo, sitting on the edge right above the text */}
                    <Tooltip title={isLiked ? 'Remove from favorites' : 'Add to favorites'}>
                      <IconButton
                        onClick={() => toggleLike(photo)}
                        aria-label={isLiked ? 'Unlike' : 'Like'}
                        sx={{ ...floatingButton, position: 'absolute', right: 16, bottom: -22, zIndex: 2 }}
                      >
                        {isLiked ? <Favorite sx={{ color: '#e53935' }} /> : <FavoriteBorder sx={{ color: '#555' }} />}
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* Short description (from Pexels), then "Captured by" on the left and the place name in calligraphy on the right */}
                  <CardContent sx={{ flexGrow: 1, p: 2, pt: 3.5, pb: '16px !important', display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      component="h3"
                      fontWeight={700}
                      title={photo.altText}
                      sx={{
                        fontSize: '1.05rem',
                        lineHeight: 1.35,
                        wordBreak: 'break-word',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {photo.altText || place}
                    </Typography>

                    <Box
                      sx={{
                        mt: 'auto',
                        pt: 1.5,
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        gap: 1.5,
                      }}
                    >
                      {/* TODO 3.6 [Attribution Links] */}
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.95rem', minWidth: 0 }}>
                        📷 Captured by:{' '}
                        <Link
                          href={photo.photographerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          underline="hover"
                          sx={{ wordBreak: 'break-word' }}
                        >
                          {photo.photographer}
                        </Link>
                      </Typography>

                      {/* Name of the place in calligraphy */}
                      <Typography
                        component="span"
                        sx={{
                          fontFamily: CALLIGRAPHY_FONT,
                          fontSize: '2rem',
                          lineHeight: 1,
                          color: 'primary.dark',
                          opacity: 0.85,
                          textAlign: 'right',
                          flexShrink: 0,
                          maxWidth: '50%',
                          wordBreak: 'break-word',
                        }}
                      >
                        {place}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Load more */}
        {visibleCount < list.length && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              sx={{ px: 4, borderColor: 'primary.main', color: 'primary.dark' }}
            >
              Load more ({list.length - visibleCount} left)
            </Button>
          </Box>
        )}
      </>
    );
  }

  return (
    <>
      {/* Switch between search results and saved favorites */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={view}
          onChange={(e, value) => setView(value)}
          textColor="inherit"
          sx={{
            minHeight: 44,
            '& .MuiTabs-indicator': { height: 3, borderRadius: 3, bgcolor: 'primary.main' },
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '1rem', minHeight: 44 },
            '& .Mui-selected': { color: 'primary.dark' },
          }}
        >
          <Tab value="results" label="Search results" />
          <Tab
            value="favorites"
            icon={<Favorite sx={{ fontSize: 18, color: '#e53935' }} />}
            iconPosition="start"
            label={`Favorites (${liked.length})`}
          />
        </Tabs>

        {showingFavorites && liked.length > 0 && (
          <Button size="small" color="error" onClick={() => setLiked([])}>
            Clear all
          </Button>
        )}
      </Box>

      {content}

      {/* Big view: the box wraps the photo (portrait or landscape), with Previous / Next buttons.
          Click the photo, outside, the X, or press Esc to go back. Arrow keys also work. */}
      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        maxWidth={false}
        PaperProps={{
          sx: {
            width: 'fit-content',
            maxWidth: 'min(94vw, 940px)',
            m: 2,
            overflow: 'hidden',
            borderRadius: 3,
          },
        }}
      >
        {selected && (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ position: 'relative', lineHeight: 0, bgcolor: '#000' }}>
              <Box
                component="img"
                key={selected.id}
                src={selected.imageUrl}
                alt={selected.altText}
                onClick={() => setSelected(null)}
                sx={{
                  display: 'block',
                  width: 'auto',
                  height: 'auto',
                  maxWidth: '100%',
                  maxHeight: '75vh',
                  mx: 'auto',
                  cursor: 'zoom-out',
                }}
              />

              {/* Close */}
              <IconButton
                onClick={() => setSelected(null)}
                aria-label="Close"
                size="small"
                sx={{ ...overlayButton, position: 'absolute', top: 10, right: 10 }}
              >
                <Close fontSize="small" />
              </IconButton>

              {/* Previous / Next */}
              {canNavigate && (
                <>
                  <IconButton
                    onClick={() => goTo(-1)}
                    aria-label="Previous photo"
                    sx={{ ...overlayButton, position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
                  >
                    <ChevronLeft />
                  </IconButton>
                  <IconButton
                    onClick={() => goTo(1)}
                    aria-label="Next photo"
                    sx={{ ...overlayButton, position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}
                  >
                    <ChevronRight />
                  </IconButton>
                </>
              )}
            </Box>

            <Box sx={{ p: 2, lineHeight: 1.4 }}>
              <Typography variant="h6" fontWeight={700}>
                {placeOf(selected)}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {selected.altText}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                📷 Captured by:{' '}
                <Link href={selected.photographerUrl} target="_blank" rel="noopener noreferrer" underline="hover">
                  {selected.photographer}
                </Link>
              </Typography>

              <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Place />}
                  href={mapsUrl(placeOf(selected))}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in Google Maps
                </Button>
                <Typography variant="caption" color="text.secondary">
                  {canNavigate ? `${selectedIndex + 1} of ${list.length} · ` : ''}
                  Use ← → to browse
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Dialog>
    </>
  );
}