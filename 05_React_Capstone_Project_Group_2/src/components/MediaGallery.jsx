import { useState } from 'react';
import {
  Box, Grid, Card, CardMedia, CardContent, Typography, Link, Skeleton, IconButton,
  Dialog, DialogContent, DialogTitle, Tooltip, Stack, useTheme, alpha,
} from '@mui/material';
import { Favorite, FavoriteBorder, OpenInNew, Close } from '@mui/icons-material';

export default function MediaGallery({ photos, loading, favoriteIds = [], onToggleFavorite }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const theme = useTheme();
  if (loading) {
    return (
      <Grid container spacing={3}>
        {Array.from({ length: 12 }, (_, index) => index + 1).map((item) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item} sx={{ display: 'flex' }}>
            <Box sx={{ width: '100%' }}>
              <Skeleton variant="rectangular" sx={{ aspectRatio: '16 / 10', borderRadius: 2 }} />
              <Skeleton width="60%" sx={{ mt: 1.5 }} />
              <Skeleton width="40%" />
            </Box>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No tourist spots found for this area yet.
        </Typography>
      </Box>
    );
  }

  return (
    <>
    <Grid container spacing={3}>
      {photos.map((photo) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={photo.id} sx={{ display: 'flex', alignSelf: 'flex-start' }}>
        <Card
          className="photo-card"
          elevation={0}
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.paper',
            borderColor: 'divider',
            '&:hover': { boxShadow: theme.shadows[6] },
          }}
        >
          <Box
            sx={{
              position: 'relative',
              cursor: 'pointer',
              height: { xs: 220, sm: 190, md: 160 },
              flexShrink: 0,
            }}
            onClick={() => setSelectedPhoto(photo)}
          >
            <CardMedia
              component="img"
            image={photo.imageUrl}
            alt={photo.altText}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
              <Box className="photo-overlay" sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: 'white', fontWeight: 700 }}>View image</Typography>
              </Box>
              <Tooltip title={favoriteIds.includes(photo.id) ? 'Remove from favorites' : 'Save to favorites'}>
                <IconButton
                  onClick={(event) => { event.stopPropagation(); onToggleFavorite(photo.id); }}
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    bgcolor: alpha(theme.palette.background.paper, 0.9),
                    '&:hover': { bgcolor: 'background.paper' },
                  }}
                  aria-label={favoriteIds.includes(photo.id) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {favoriteIds.includes(photo.id) ? <Favorite color="secondary" /> : <FavoriteBorder />}
                </IconButton>
              </Tooltip>
            </Box>

            <CardContent sx={{ height: 72, flexShrink: 0, p: 2, overflow: 'hidden' }}>
              <Typography variant="caption" display="block" color="text.secondary">
                📸 Captured by:
              </Typography>
              <Link
                href={photo.photographerUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
                underline="hover"
                sx={{
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {photo.photographer}
              </Link>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
    <Dialog open={Boolean(selectedPhoto)} onClose={() => setSelectedPhoto(null)} maxWidth="md" fullWidth>
      {selectedPhoto && (
        <>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography fontWeight={800}>A closer look</Typography>
            <IconButton onClick={() => setSelectedPhoto(null)} aria-label="Close image viewer"><Close /></IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: { xs: 1, sm: 3 } }}>
            <Box component="img" src={selectedPhoto.imageUrl} alt={selectedPhoto.altText} sx={{ display: 'block', width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 2 }} />
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', pt: 2 }}>
              <Typography color="text.secondary">{selectedPhoto.altText}</Typography>
              <Link href={selectedPhoto.photographerUrl} target="_blank" rel="noopener noreferrer" underline="hover">
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>Photo by {selectedPhoto.photographer}<OpenInNew sx={{ fontSize: 16 }} /></Stack>
              </Link>
            </Stack>
          </DialogContent>
        </>
      )}
    </Dialog>
    </>
  );
}