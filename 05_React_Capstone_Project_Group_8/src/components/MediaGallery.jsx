import React from 'react';
import { Box, Grid, Card, CardMedia, CardContent, Typography, Link, Skeleton } from '@mui/material';

export default function MediaGallery({ photos, loading }) {
  // TODO 3.1 [Loading Skeletal Feedbacks]: If 'loading' prop parameters evaluate true, return a visual helper feedback container.
  // Pro Tip: Loop a standard array wrapper or mock layout blocks to show a clean visual waiting feedback (e.g. Loading indicator or Skeletons).
  if (loading) {
    return (
      <Grid container spacing={3}>
      {[...Array(6)].map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
          <Skeleton variant="text" sx={{ mt: 1 }} />
          <Skeleton variant="text" width="60%" />
        </Grid>
      ))}
    </Grid>
    );
  }

  // TODO 3.2 [Boundary Validation Checks]: If photos state parameter arrays contain no records, return a fallback template.
  // Render a clean structural layout text header displaying a simple status report like: "No tourist spots found for this area yet."
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
    // TODO 3.3 [Fluid Layout Architecture]: Implement a highly responsive grid container layout matching flexible sizing constraints.
    // Map across your structured 'photos' payload elements inside the grid layout logic.
    <Grid container spacing={3}>
            {/* TODO 3.4 [Card Content Loop Mapping]: Loop across the photo elements.
          Configure grid cell sizes dynamically matching view constraints: xs=12, sm=6, md=4 columns */}
      {photos.map((photo) => (
        <Grid item xs={12} sm={6} md={4} key={photo.id}>
          <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
            
            {/* TODO 3.5 [Multimedia Presentation Layer]: Render an MUI <CardMedia /> item block targeting photo image pointers.
                Incorporate 'photo.imageUrl' into the media src layer and bind your 'photo.altText' to native asset labels. */}
            <CardMedia
              component="img"
              height="200"
              image={photo.imageUrl}
              alt={photo.altText}
            />
            
            <CardContent sx={{ flexGrow: 1, p: 2 }}>
              <Typography variant="caption" display="block" color="text.secondary">
                📸 Captured by:
              </Typography>
              {/* TODO 3.6 [Attribution Links]: Add an MUI external <Link> layout pointer.
                  Configure href='photo.photographerUrl' and populate item typography displaying 'photo.photographer'. */}
              <Link 
                href={photo.photographerUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                color="primary"
              >
                {photo.photographer}
              </Link>
            </CardContent>
          </Card>
        </Grid>
      ))}
      {/* End Loop */}
    </Grid>
  );
}