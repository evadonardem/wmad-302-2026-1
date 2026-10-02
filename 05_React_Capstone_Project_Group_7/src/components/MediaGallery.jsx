import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Link,
  Skeleton,
} from '@mui/material';

export default function MediaGallery({ photos, loading }) {
  // Show loading placeholders while searching
  if (loading) {
    return (
      <Grid container spacing={2}>
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item}>
            <Card sx={{ borderRadius: 3 }}>
              <Skeleton
                variant="rectangular"
                height={170}
                animation="wave"
              />
              <CardContent>
                <Skeleton width="60%" />
                <Skeleton width="80%" />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  // Show a message if no photos are available
  if (!photos || photos.length === 0) {
    return (
      <Box
        sx={{
          minHeight: 160,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          p: 3,
          borderRadius: 3,
          bgcolor: 'action.hover',
        }}
      >
        <Typography sx={{ fontSize: '2rem', mb: 1 }}>
          📷
        </Typography>

        <Typography sx={{ fontWeight: 'bold', mb: 0.5 }}>
          No tourist spots found for this area yet.
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Select a city or municipality above and press Search
          to look for photos.
        </Typography>
      </Box>
    );
  }

  // Display photos in a responsive grid
  return (
    <Grid container spacing={2}>
      {photos.map((photo) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={photo.id}>
          <Card
            sx={{
              height: '100%',
              borderRadius: 3,
              overflow: 'hidden',
              transition: '0.2s',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: 4,
              },
            }}
          >
            <CardMedia
              component="img"
              height="180"
              image={photo.imageUrl}
              alt={photo.altText}
              sx={{ objectFit: 'cover' }}
            />

            <CardContent>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                📸 Captured by:
              </Typography>

              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                <Link
                  href={photo.photographerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {photo.photographer}
                </Link>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}