import React from 'react';
import { Box, Grid, Card, CardMedia, CardContent, Typography, Link, Skeleton } from '@mui/material';
import {
  Close, ArrowBackIosNew, ArrowForwardIos, Download, Share,
  ThumbUp, ThumbUpOutlined, Star, StarBorder,
} from '@mui/icons-material';

const load = (k) => { try { return new Set(JSON.parse(localStorage.getItem(k) || '[]')); } catch { return new Set(); } };
const store = (k, s) => { try { localStorage.setItem(k, JSON.stringify([...s])); } catch { } };

function Lightbox({ photos, index, placeName, onChange, onClose }) {
  const photo = photos[index];
  const [likes, setLikes] = useState(() => load('lakbay:likes'));
  const [favs, setFavs] = useState(() => load('lakbay:favs'));
  const [note, setNote] = useState('');

  const go = useCallback((d) => onChange((index + d + photos.length) % photos.length), [index, photos.length, onChange]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  useEffect(() => setNote(''), [index]);

  const toggle = (set, setter, key) => {
    const next = new Set(set);
    if (next.has(photo.id)) next.delete(photo.id); else next.add(photo.id);
    setter(next);
    store(key, next);
  };

  const download = async () => {
    try {
      const res = await fetch(photo.originalUrl);
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = `${placeName}-${photo.id}.jpg`.replace(/\s+/g, '-');
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(photo.originalUrl, '_blank', 'noopener'); // fallback if the CDN blocks fetch
    }
  };

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: placeName, text: photo.altText, url: photo.pageUrl });
      else { await navigator.clipboard.writeText(photo.pageUrl); setNote('Link copied'); }
    } catch { /* cancelled */ }
  };

  const arrow = (side) => ({
    position: 'absolute', top: '50%', transform: 'translateY(-50%)', [side]: 12,
    bgcolor: 'rgba(0,0,0,.45)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,.7)' },
  });
  const ghost = { textTransform: 'none', color: '#fff', borderColor: 'rgba(255,255,255,.6)' };

  return (
    <Box
      role="dialog" aria-modal="true" aria-label="Enlarged photo" onClick={onClose}
      sx={{
        position: 'fixed', inset: 0, zIndex: 1400, display: 'flex', p: { xs: 1, md: 4 },
        bgcolor: 'rgba(5,15,25,.55)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{ m: 'auto', width: '100%', maxWidth: 1250, height: { xs: '100%', md: '86vh' }, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}
      >
        <Box sx={{ position: 'relative', flex: '1 1 62%', minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box component="img" src={photo.fullUrl} alt={photo.altText}
            sx={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 2, boxShadow: 8, objectFit: 'contain' }} />
          <IconButton aria-label="Previous photo" onClick={() => go(-1)} sx={arrow('left')}><ArrowBackIosNew /></IconButton>
          <IconButton aria-label="Next photo" onClick={() => go(1)} sx={arrow('right')}><ArrowForwardIos /></IconButton>
        </Box>

        <Box sx={{ flex: '1 1 38%', color: '#fff', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', position: 'relative', pr: { md: 5 } }}>
          <IconButton aria-label="Close" onClick={onClose} sx={{ position: 'absolute', top: 0, right: 0, color: '#fff' }}><Close /></IconButton>
          <Typography variant="overline" sx={{ opacity: 0.8 }}>{placeName} · {index + 1} of {photos.length}</Typography>
          <Typography variant="h5" fontWeight={600}>{photo.altText}</Typography>
          <Divider sx={{ borderColor: 'rgba(255,255,255,.25)' }} />
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.75 }} display="block">📸 Captured by</Typography>
            <Link href={photo.photographerUrl} target="_blank" rel="noopener noreferrer" sx={{ color: '#fff', fontWeight: 600 }}>
              {photo.photographer}
            </Link>
          </Box>
          <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mt: 1 }}>
            <Button variant="contained" startIcon={<Download />} onClick={download} sx={{ textTransform: 'none' }}>Download</Button>
            <Button variant="outlined" startIcon={<Share />} onClick={share} sx={ghost}>Share</Button>
            <Button variant={likes.has(photo.id) ? 'contained' : 'outlined'}
              startIcon={likes.has(photo.id) ? <ThumbUp /> : <ThumbUpOutlined />}
              onClick={() => toggle(likes, setLikes, 'lakbay:likes')}
              sx={likes.has(photo.id) ? { textTransform: 'none' } : ghost}>
              {likes.has(photo.id) ? 'Liked' : 'Like'}
            </Button>
            <Button variant={favs.has(photo.id) ? 'contained' : 'outlined'}
              startIcon={favs.has(photo.id) ? <Star /> : <StarBorder />}
              onClick={() => toggle(favs, setFavs, 'lakbay:favs')}
              sx={favs.has(photo.id) ? { textTransform: 'none' } : ghost}>
              {favs.has(photo.id) ? 'Favorited' : 'Favorite'}
            </Button>
          </Stack>
          {note && <Typography variant="body2" role="status">{note}</Typography>}
        </Box>
      </Box>
    </Box>
  );
}

export default function MediaGallery({ photos, loading }) {
  // TODO 3.1 [Loading Skeletal Feedbacks]: If 'loading' prop parameters evaluate true, return a visual helper feedback container.
  // Pro Tip: Loop a standard array wrapper or mock layout blocks to show a clean visual waiting feedback (e.g. Loading indicator or Skeletons).
  const [openIndex, setOpenIndex] = useState(null);
  useEffect(() => setOpenIndex(null), [photos]);

  if (loading) {
    return (
      <Grid container spacing={3}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Card elevation={3} sx={{ borderRadius: 2 }}>
              <Skeleton variant="rectangular" height={240} />
              <CardContent><Skeleton width="60%" /></CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  // TODO 3.2 [Boundary Validation Checks]: If photos state parameter arrays contain no records, return a fallback template.
  // Render a clean structural layout text header displaying a simple status report like: "No tourist spots found for this area yet."
  if (!photos || photos.length === 0) {
    return (
      // [Your empty state boundary here]
      <Typography variant="h6" align="center" sx={{ color: '#fff', py: 6 }}>
        No tourist spots found for this area yet.
      </Typography>
    );
  }

  return (
    <>
      {/* TODO 3.3 [Fluid Layout Architecture] */}
      <Grid container spacing={3}>
        {/* TODO 3.4 [Card Content Loop Mapping] */}
        {photos.map((photo, i) => (
          <Grid item xs={12} sm={6} md={4} key={photo.id}>
            <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
              {/* TODO 3.5 [Multimedia Presentation Layer] - clickable to enlarge */}
              <CardActionArea onClick={() => setOpenIndex(i)} aria-label={`Enlarge photo: ${photo.altText}`}>
                <CardMedia component="img" image={photo.imageUrl} alt={photo.altText} loading="lazy"
                  sx={{ height: 240, objectFit: 'cover' }} />
              </CardActionArea>

              <CardContent sx={{ flexGrow: 1, p: 2 }}>
                <Typography variant="caption" display="block" color="text.secondary">
                  📸 Captured by:
                </Typography>
                {/* TODO 3.6 [Attribution Links] */}
                <Link href={photo.photographerUrl} target="_blank" rel="noopener noreferrer" underline="hover">
                  {photo.photographer}
                </Link>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {openIndex !== null && photos[openIndex] && (
        <Lightbox photos={photos} index={openIndex} placeName={placeName}
          onChange={setOpenIndex} onClose={() => setOpenIndex(null)} />
      )}
    </>
  );
}