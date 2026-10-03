import React, { useState } from 'react';
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Link,
  Skeleton,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Grow,
  Stack,
  Dialog,
  Snackbar,
  Button,
} from '@mui/material';
import {
  Place,
  OpenInNew,
  Landscape,
  Favorite,
  FavoriteBorder,
  ZoomIn,
  Close,
  ChevronLeft,
  ChevronRight,
  ContentCopy,
  Download,
  DeleteSweep,
} from '@mui/icons-material';

const FAVORITES_KEY = 'lakbay_favorite_photos';

// Responsive CSS grid: 1 column on phones, 2 on tablets, 3 on desktops
const gridSx = {
  display: 'grid',
  gap: 3,
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, 1fr)',
    md: 'repeat(3, 1fr)',
  },
};

// Small round button used on top of photos
const overlayBtnSx = {
  position: 'absolute',
  top: 10,
  bgcolor: 'rgba(0,0,0,0.45)',
  color: '#fff',
  '&:hover': { bgcolor: 'rgba(0,0,0,0.65)' },
};

export default function MediaGallery({ photos, loading, hasSearched = true, locationName = '' }) {
  // Extra features: saved photos (kept in the browser), saved-only view, lightbox, toast messages
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    } catch {
      return [];
    }
  });
  const [showFavorites, setShowFavorites] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [toast, setToast] = useState('');

  const displayed = showFavorites ? favorites : photos || [];
  const current = lightboxIndex !== null ? displayed[lightboxIndex] : null;

  const isFavorite = (id) => favorites.some((item) => item.id === id);

  const toggleFavorite = (photo) => {
    const exists = isFavorite(photo.id);
    const next = exists
      ? favorites.filter((item) => item.id !== photo.id)
      : [{ ...photo, location: photo.location || locationName }, ...favorites];

    setFavorites(next);
    setToast(exists ? 'Removed from saved photos' : 'Saved to your favorites');
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable: ignore
    }
  };

  // Remove every saved photo at once
  const clearFavorites = () => {
    if (!window.confirm('Remove all saved photos?')) return;
    setFavorites([]);
    setLightboxIndex(null);
    try {
      localStorage.removeItem(FAVORITES_KEY);
    } catch {
      // storage unavailable: ignore
    }
    setToast('All saved photos cleared');
  };

  const copyLink = async (photo) => {
    try {
      await navigator.clipboard.writeText(photo.imageUrl);
      setToast('Photo link copied');
    } catch {
      setToast('Could not copy the link');
    }
  };

  // Download the photo as a file (falls back to opening it in a new tab)
  const downloadPhoto = async (photo) => {
    try {
      const response = await fetch(photo.imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lakbay-ph-${photo.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setToast('Download started');
    } catch {
      window.open(photo.imageUrl, '_blank', 'noopener,noreferrer');
      setToast('Opened the photo in a new tab. Right-click it to save.');
    }
  };

  const closeLightbox = () => setLightboxIndex(null);
  const showNext = () => setLightboxIndex((i) => (i + 1) % displayed.length);
  const showPrev = () => setLightboxIndex((i) => (i - 1 + displayed.length) % displayed.length);

  const handleLightboxKeys = (e) => {
    if (displayed.length < 2) return;
    if (e.key === 'ArrowRight') showNext();
    if (e.key === 'ArrowLeft') showPrev();
  };

  // TODO 3.1 [Loading Skeletal Feedbacks]: If 'loading' prop parameters evaluate true, return a visual helper feedback container.
  // Pro Tip: Loop a standard array wrapper or mock layout blocks to show a clean visual waiting feedback (e.g. Loading indicator or Skeletons).
  if (loading) {
    return (
      // [Your loading layout here]
      <Box sx={gridSx}>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Card key={item} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 4 }}>
            <Skeleton variant="rectangular" height={240} animation="wave" />
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ flexGrow: 1 }}>
                  <Skeleton width="40%" />
                  <Skeleton width="70%" />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  // Toolbar: heading + saved-photos toggle (+ clear all when viewing saved photos)
  const toolbar = (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }} flexWrap="wrap" useFlexGap>
      <Typography variant="h5" component="h2">
        {showFavorites ? 'Your saved photos' : `Tourist spots in ${locationName}`}
      </Typography>
      <Chip label={`${displayed.length} photos`} color="primary" size="small" />
      <Box sx={{ flexGrow: 1 }} />
      {showFavorites && favorites.length > 0 && (
        <Button size="small" color="error" variant="outlined" startIcon={<DeleteSweep />} onClick={clearFavorites}>
          Clear all
        </Button>
      )}
      {(favorites.length > 0 || showFavorites) && (
        <Chip
          icon={showFavorites ? <Favorite /> : <FavoriteBorder />}
          label={`Saved (${favorites.length})`}
          color="primary"
          variant={showFavorites ? 'filled' : 'outlined'}
          clickable
          onClick={() => setShowFavorites(!showFavorites)}
        />
      )}
    </Stack>
  );

  // TODO 3.2 [Boundary Validation Checks]: If photos state parameter arrays contain no records, return a fallback template.
  // Render a clean structural layout text header displaying a simple status report like: "No tourist spots found for this area yet."
  if (displayed.length === 0) {
    return (
      // [Your empty state boundary here]
      <Box>
        {(favorites.length > 0 || showFavorites) && (
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <Chip
              icon={showFavorites ? <Favorite /> : <FavoriteBorder />}
              label={`Saved (${favorites.length})`}
              color="primary"
              variant={showFavorites ? 'filled' : 'outlined'}
              clickable
              onClick={() => setShowFavorites(!showFavorites)}
            />
          </Stack>
        )}
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <Landscape sx={{ fontSize: 72, mb: 1, opacity: 0.5 }} />
          {showFavorites ? (
            <Typography variant="h6">No saved photos yet. Tap the heart on any photo.</Typography>
          ) : !hasSearched ? (
            <Typography variant="h6">Pick a region and a city to start exploring.</Typography>
          ) : (
            <>
              <Typography variant="h6">No tourist spots found for this area yet.</Typography>
              <Typography variant="body2">Try another city or municipality.</Typography>
            </>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {toolbar}

      {/* TODO 3.3 [Fluid Layout Architecture]: Implement a highly responsive grid container layout matching flexible sizing constraints.
          Map across your structured 'photos' payload elements inside the grid layout logic. */}
      <Box sx={gridSx}>
        {/* TODO 3.4 [Card Content Loop Mapping]: Loop across the photo elements.
            Configure grid cell sizes dynamically matching view constraints: xs=12, sm=6, md=4 columns */}
        {/* [Your map loop here] */}
        {displayed.map((photo, index) => (
          <Grow in timeout={400 + Math.min(index, 8) * 120} key={photo.id}>
            <Card
              elevation={0}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                border: 1,
                borderColor: 'divider',
                borderRadius: 4,
                overflow: 'hidden',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': { transform: 'translateY(-6px)', boxShadow: 8 },
                '&:hover .gallery-img': { transform: 'scale(1.06)' },
                '&:hover .zoom-hint': { opacity: 1 },
              }}
            >
              {/* Click (or press Enter on) the photo to enlarge it */}
              <Box
                role="button"
                tabIndex={0}
                aria-label={`Enlarge photo: ${photo.altText}`}
                onClick={() => setLightboxIndex(index)}
                onKeyDown={(e) => e.key === 'Enter' && setLightboxIndex(index)}
                sx={{ position: 'relative', overflow: 'hidden', cursor: 'zoom-in' }}
              >
                {/* TODO 3.5 [Multimedia Presentation Layer]: Render an MUI <CardMedia /> item block targeting photo image pointers.
                    Incorporate 'photo.imageUrl' into the media src layer and bind your 'photo.altText' to native asset labels. */}
                {/* [Your code here] */}
                <CardMedia
                  className="gallery-img"
                  component="img"
                  height="240"
                  image={photo.imageUrl}
                  alt={photo.altText}
                  loading="lazy"
                  sx={{ objectFit: 'cover', transition: 'transform 0.5s ease' }}
                />

                {/* Zoom hint on hover */}
                <Box
                  className="zoom-hint"
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(0,0,0,0.25)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    pointerEvents: 'none',
                  }}
                >
                  <ZoomIn sx={{ color: '#fff', fontSize: 48 }} />
                </Box>

                {/* Save / unsave button */}
                <Tooltip title={isFavorite(photo.id) ? 'Remove from saved' : 'Save photo'}>
                  <IconButton
                    size="small"
                    aria-label="save photo"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(photo);
                    }}
                    sx={{ ...overlayBtnSx, right: 10, color: isFavorite(photo.id) ? '#ff5a7a' : '#fff' }}
                  >
                    {isFavorite(photo.id) ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
                  </IconButton>
                </Tooltip>

                {/* Download button */}
                <Tooltip title="Download photo">
                  <IconButton
                    size="small"
                    aria-label="download photo"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadPhoto(photo);
                    }}
                    sx={{ ...overlayBtnSx, right: 52 }}
                  >
                    <Download fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Chip
                  icon={<Place />}
                  label={photo.recommended ? `${photo.recommended} · ${photo.location || locationName}` : photo.location || locationName}
                  size="small"
                  sx={{
                    position: 'absolute',
                    bottom: 12,
                    left: 12,
                    maxWidth: 'calc(100% - 24px)',
                    color: '#fff',
                    bgcolor: 'rgba(0,0,0,0.55)',
                    backdropFilter: 'blur(4px)',
                    '& .MuiChip-icon': { color: '#fff' },
                  }}
                />
              </Box>

              <CardContent sx={{ flexGrow: 1, p: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                    {photo.photographer?.charAt(0)}
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="caption" display="block" color="text.secondary">
                      📸 Captured by:
                    </Typography>
                    {/* TODO 3.6 [Attribution Links]: Add an MUI external <Link> layout pointer.
                        Configure href='photo.photographerUrl' and populate item typography displaying 'photo.photographer'. */}
                    {/* [Your code here] */}
                    <Link
                      href={photo.photographerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="hover"
                      fontWeight={600}
                      noWrap
                      display="block"
                    >
                      {photo.photographer}
                    </Link>
                  </Box>
                  <Tooltip title="View photographer profile">
                    <IconButton
                      size="small"
                      color="primary"
                      component="a"
                      href={photo.photographerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="open photographer profile"
                    >
                      <OpenInNew fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </CardContent>
            </Card>
          </Grow>
        ))}
        {/* End Loop */}
      </Box>

      {/* Lightbox: enlarged photo with description, arrows, keyboard navigation and actions */}
      <Dialog
        open={Boolean(current)}
        onClose={closeLightbox}
        maxWidth="lg"
        fullWidth
        onKeyDown={handleLightboxKeys}
        sx={{
          '& .MuiBackdrop-root': { backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' },
          '& .MuiDialog-paper': { bgcolor: '#0F171B', color: '#fff', borderRadius: 4, overflow: 'hidden' },
        }}
      >
        {current && (
          <>
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                bgcolor: '#000',
              }}
            >
              <Box
                component="img"
                src={current.imageUrl}
                alt={current.altText}
                sx={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block' }}
              />

              <IconButton
                onClick={closeLightbox}
                aria-label="close"
                sx={{ position: 'absolute', top: 12, right: 12, color: '#fff', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
              >
                <Close />
              </IconButton>

              {displayed.length > 1 && (
                <>
                  <IconButton
                    onClick={showPrev}
                    aria-label="previous photo"
                    sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#fff', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
                  >
                    <ChevronLeft fontSize="large" />
                  </IconButton>
                  <IconButton
                    onClick={showNext}
                    aria-label="next photo"
                    sx={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#fff', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
                  >
                    <ChevronRight fontSize="large" />
                  </IconButton>
                </>
              )}
            </Box>

            {/* Label + description of the photo */}
            <Box sx={{ px: 2, pt: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {current.category ? `${current.category} · ` : ''}
                  {current.location || locationName}
                  {current.recommended ? ` · recommended: ${current.recommended}` : ''}
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                {current.altText || `Tourist spot in ${current.location || locationName}.`}
              </Typography>
            </Box>

            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap sx={{ p: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>{current.photographer?.charAt(0)}</Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="caption" display="block" sx={{ opacity: 0.7 }}>
                  📸 Captured by:
                </Typography>
                <Link
                  href={current.photographerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  fontWeight={600}
                  sx={{ color: 'secondary.main' }}
                >
                  {current.photographer}
                </Link>
              </Box>

              <Chip label={`${lightboxIndex + 1} / ${displayed.length}`} size="small" sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.12)' }} />

              <Tooltip title={isFavorite(current.id) ? 'Remove from saved' : 'Save photo'}>
                <IconButton onClick={() => toggleFavorite(current)} sx={{ color: isFavorite(current.id) ? '#ff5a7a' : '#fff' }}>
                  {isFavorite(current.id) ? <Favorite /> : <FavoriteBorder />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Download photo">
                <IconButton onClick={() => downloadPhoto(current)} sx={{ color: '#fff' }}>
                  <Download />
                </IconButton>
              </Tooltip>
              <Tooltip title="Copy photo link">
                <IconButton onClick={() => copyLink(current)} sx={{ color: '#fff' }}>
                  <ContentCopy />
                </IconButton>
              </Tooltip>
              <Tooltip title="Open full photo in a new tab">
                <IconButton component="a" href={current.imageUrl} target="_blank" rel="noopener noreferrer" sx={{ color: '#fff' }}>
                  <OpenInNew />
                </IconButton>
              </Tooltip>
            </Stack>
          </>
        )}
      </Dialog>

      {/* Toast messages */}
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={2200}
        onClose={() => setToast('')}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}