import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Link,
  Skeleton,
  Chip,
  Avatar,
  Dialog,
  DialogContent,
  IconButton,
  Button,
  Divider,
} from '@mui/material';
import { PhotoCamera, OpenInNew, Close, Person, Download } from '@mui/icons-material';

export default function MediaGallery({ photos, loading }) {
  // State para sa Big Screen Preview Modal
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const handleOpenModal = (photo) => {
    setSelectedPhoto(photo);
  };

  const handleCloseModal = () => {
    setSelectedPhoto(null);
  };

  // Loading Skeletal Feedback
  if (loading) {
    return (
      <Grid container spacing={3}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Grid key={index} xs={12} sm={6} md={4}>
            <Card sx={{ borderRadius: 4, overflow: 'hidden' }}>
              <Skeleton variant="rectangular" height={240} animation="wave" />
              <CardContent sx={{ p: 2 }}>
                <Skeleton variant="text" width="30%" height={20} />
                <Skeleton variant="text" width="60%" height={24} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  // Empty State Fallback
  if (!photos || photos.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <PhotoCamera sx={{ fontSize: 60, color: 'text.disabled', mb: 1 }} />
        <Typography variant="h6" color="text.secondary" fontWeight={500}>
          No tourist spots found for this area yet.
        </Typography>
        <Typography variant="body2" color="text.disabled">
          Try selecting another city or municipality from the dropdown.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Grid container spacing={3}>
        {photos.map((photo) => (
          <Grid key={photo.id} xs={12} sm={6} md={4}>
            <Card
              elevation={2}
              onClick={() => handleOpenModal(photo)}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 4,
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  boxShadow: '0 12px 24px rgba(0, 0, 0, 0.18)',
                  '& .zoomable-img': {
                    transform: 'scale(1.06)',
                  },
                },
              }}
            >
              {/* Overlay Badge */}
              <Chip
                icon={<PhotoCamera sx={{ fontSize: '14px !important', color: '#fff !important' }} />}
                label="Lakbay Spot"
                size="small"
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  zIndex: 2,
                  backgroundColor: 'rgba(15, 76, 129, 0.85)',
                  backdropFilter: 'blur(6px)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                }}
              />

              {/* Image Container with Zoom effect */}
              <Box sx={{ overflow: 'hidden', height: 230, backgroundColor: '#f0f0f0' }}>
                <CardMedia
                  component="img"
                  height="230"
                  image={photo.imageUrl}
                  alt={photo.altText}
                  loading="lazy"
                  className="zoomable-img"
                  sx={{
                    transition: 'transform 0.4s ease',
                    objectFit: 'cover',
                  }}
                />
              </Box>

              {/* Photographer Attribution Content */}
              <CardContent sx={{ flexGrow: 1, p: 2 }}>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>
                  Kinuha ni:
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                    <Avatar sx={{ width: 26, height: 26, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
                      {photo.photographer ? photo.photographer.charAt(0) : 'P'}
                    </Avatar>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {photo.photographer}
                    </Typography>
                  </Box>

                  <Link
                    href={photo.photographerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    underline="hover"
                    color="primary"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.3,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Profile <OpenInNew sx={{ fontSize: 13 }} />
                  </Link>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* BIG SCREEN PREVIEW MODAL */}
      <Dialog
        open={Boolean(selectedPhoto)}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
            backgroundColor: 'background.paper',
          },
        }}
      >
        {selectedPhoto && (
          <Box sx={{ position: 'relative' }}>
            {/* Close Button */}
            <IconButton
              onClick={handleCloseModal}
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 10,
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: '#fff',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.8)' },
              }}
            >
              <Close />
            </IconButton>

            {/* High-Res Display */}
            <Box
              sx={{
                width: '100%',
                maxHeight: '70vh',
                backgroundColor: '#000',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Box
                component="img"
                src={selectedPhoto.imageUrl}
                alt={selectedPhoto.altText}
                sx={{
                  width: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                }}
              />
            </Box>

            {/* Modal Bottom Information Panel */}
            <DialogContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                {selectedPhoto.altText}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2} alignItems="center">
                <Grid xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                      <Person />
                    </Avatar>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Photographer / Creator
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedPhoto.photographer}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid xs={12} sm={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, gap: 1.5 }}>
                  <Button
                    variant="outlined"
                    startIcon={<OpenInNew />}
                    href={selectedPhoto.photographerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}
                  >
                    View Original
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    href={selectedPhoto.imageUrl}
                    target="_blank"
                    download
                    sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}
                  >
                    HD Photo
                  </Button>
                </Grid>
              </Grid>
            </DialogContent>
          </Box>
        )}
      </Dialog>
    </>
  );
}