import React, { useState } from 'react';
import {
  Box,
  Card,
  CardMedia,
  Typography,
  Link,
  Skeleton,
  Dialog,
  IconButton,
} from '@mui/material';
import { ImageSearch, OpenInNew, Close } from '@mui/icons-material';

const gridSx = {
  display: 'grid',
  gap: 2.5,
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, minmax(0, 1fr))',
    xl: 'repeat(3, minmax(0, 1fr))',
  },
};

export default function MediaGallery({ photos, loading, hasSearched }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  if (loading) {
    return (
      <Box sx={gridSx}>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Skeleton
            key={item}
            variant="rounded"
            height={260}
            animation="wave"
            sx={{ borderRadius: 4 }}
          />
        ))}
      </Box>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <Box
        sx={{
          minHeight: 280,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          p: 3,
          borderRadius: 4,
          border: '1px dashed',
          borderColor: 'divider',
          bgcolor: 'action.hover',
        }}
      >
        <ImageSearch sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />

        <Typography sx={{ fontWeight: 'bold', mb: 0.5 }}>
          {hasSearched
            ? 'No tourist spots found for this location.'
            : 'Ready to explore?'}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          {hasSearched
            ? 'Try selecting a different city or municipality.'
            : 'Select a region and city on the left, then click Search.'}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={gridSx}>
        {photos.map((photo) => (
          <Card
            key={photo.id}
            elevation={0}
            onClick={() => setSelectedPhoto(photo)}
            sx={{
              position: 'relative',
              height: 260,
              borderRadius: 4,
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 0.25s, box-shadow 0.25s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 16px 32px rgba(78, 18, 40, 0.28)',
              },
            }}
          >
            <CardMedia
              component="img"
              image={photo.imageUrl}
              alt={photo.altText}
              loading="lazy"
              sx={{ height: '100%', width: '100%', objectFit: 'cover' }}
            />

            <Box
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                p: 2,
                pt: 5,
                background:
                  'linear-gradient(to top, rgba(44, 11, 23, 0.92), rgba(44, 11, 23, 0))',
              }}
            >
              <Typography
                variant="caption"
                sx={{ display: 'block', color: 'rgba(248, 236, 230, 0.75)' }}
              >
                Captured by
              </Typography>

              <Typography variant="body2" noWrap sx={{ fontWeight: 'bold' }}>
                <Link
                  href={photo.photographerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  onClick={(e) => e.stopPropagation()}
                  sx={{ color: '#e3c48d' }}
                >
                  {photo.photographer}
                </Link>
              </Typography>
            </Box>
          </Card>
        ))}
      </Box>

      {/* Lightbox Preview */}
      <Dialog
        open={Boolean(selectedPhoto)}
        onClose={() => setSelectedPhoto(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, bgcolor: '#1a1a1a', color: '#fff', overflow: 'hidden' },
        }}
      >
        {selectedPhoto && (
          <Box sx={{ position: 'relative' }}>
            <IconButton
              onClick={() => setSelectedPhoto(null)}
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                color: '#fff',
                bgcolor: 'rgba(0,0,0,0.5)',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
              }}
            >
              <Close />
            </IconButton>

            <Box
              component="img"
              src={selectedPhoto.originalUrl || selectedPhoto.imageUrl}
              alt={selectedPhoto.altText}
              sx={{
                width: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                bgcolor: '#000',
              }}
            />

            <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {selectedPhoto.altText}
                </Typography>
                <Typography variant="body2" color="grey.400">
                  Photo by{' '}
                  <Link
                    href={selectedPhoto.photographerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: '#e3c48d' }}
                  >
                    {selectedPhoto.photographer}
                  </Link>
                </Typography>
              </Box>

              {selectedPhoto.pexelsUrl && (
                <IconButton
                  component="a"
                  href={selectedPhoto.pexelsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: '#e3c48d' }}
                >
                  <OpenInNew />
                </IconButton>
              )}
            </Box>
          </Box>
        )}
      </Dialog>
    </>
  );
}