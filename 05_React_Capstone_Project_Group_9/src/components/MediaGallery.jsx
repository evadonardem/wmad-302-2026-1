import React from 'react';
import { Box, Grid, Card, CardMedia, CardContent, Typography, Link, Skeleton } from '@mui/material';

export default function MediaGallery({ photos, loading }) {
  // TODO 3.1 [Loading Skeletal Feedbacks]
  if (loading) {
    return (
      <Grid container spacing={3}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card elevation={3} sx={{ borderRadius: 2 }}>
              <Skeleton variant="rectangular" height={200} />
              <CardContent>
                <Skeleton width="60%" />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  // TODO 3.2 [Boundary Validation Checks]
  if (!photos || photos.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="h6" color="text.secondary">
          No tourist spots found for this area yet.
        </Typography>
      </Box>
    );
  }

  return (
    // TODO 3.3 [Fluid Layout Architecture]
    <Grid container spacing={3}>
      {/* TODO 3.4 [Card Content Loop Mapping] */}
      {photos.map((photo) => (
        <Grid key={photo.id} size={{ xs: 12, sm: 6, md: 4 }}>
          <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2 }}>

            {/* TODO 3.5 [Multimedia Presentation Layer] */}
            <CardMedia
              component="img"
              height="200"
              image={photo.imageUrl}
              alt={photo.altText}
            />

            <CardContent sx={{ flexGrow: 1, p: 2 }}>
              <Typography variant="caption" display="block" color="text.secondary">
                📷 Captured by:
              </Typography>
              {/* TODO 3.6 [Attribution Links] */}
              <Link
                href={photo.photographerUrl}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
              >
                {photo.photographer}
              </Link>
            </CardContent>

          </Card>
        </Grid>
      ))}
    </Grid>
  );
}