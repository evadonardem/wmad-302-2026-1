import React from 'react';
import {
  Box,
  Card,
  CardMedia,
  Typography,
  Link,
  Skeleton,
} from '@mui/material';
import { ImageSearch } from '@mui/icons-material';

const gridSx = {
  display: 'grid',
  gap: 2.5,
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, minmax(0, 1fr))',
    xl: 'repeat(3, minmax(0, 1fr))',
  },
};

export default function MediaGallery({ photos, loading }) {
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
          No tourist spots found for this area yet.
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Select a city or municipality and press Search to look for photos.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={gridSx}>
      {photos.map((photo) => (
        <Card
          key={photo.id}
          elevation={0}
          sx={{
            position: 'relative',
            height: 260,
            borderRadius: 4,
            overflow: 'hidden',
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
                sx={{ color: '#e3c48d' }}
              >
                {photo.photographer}
              </Link>
            </Typography>
          </Box>
        </Card>
      ))}
    </Box>
  );
}