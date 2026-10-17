import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardMedia, CardContent, Typography, Link, Skeleton, IconButton, Dialog, Snackbar, Alert } from '@mui/material';
import { Download, Close, Fullscreen, Favorite, FavoriteBorder, Share } from '@mui/icons-material';

export default function MediaGallery({ photos = [], loading }) {
  // Lightbox
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Likes
  const [likedPhotos, setLikedPhotos] = useState(() => {
    const saved = localStorage.getItem('lakbay-liked-photos');
    return saved ? JSON.parse(saved) : {};
  });
  
  // Share notification
  const [shareNotice, setShareNotice] = useState(false);
  
  // Save likes
  useEffect(() => {
    localStorage.setItem('lakbay-liked-photos', JSON.stringify(likedPhotos));
  }, [likedPhotos]);

  // Loading state
  if (loading) {
    return (
      <Grid container spacing={3} sx={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {[...Array(6)].map((_, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Skeleton variant="rectangular" sx={{ width: '100%', height: '220px', borderRadius: '24px 24px 0 0' }} />
            <Skeleton variant="rectangular" sx={{ width: '100%', height: '120px', borderRadius: '0 0 24px 24px' }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  // Empty state
  if (!photos || photos.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 10, px: 4, bgcolor: 'background.paper', borderRadius: 4, maxWidth: '1400px', margin: '0 auto' }}>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
          🌍 Start Exploring
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select a region and city on the left, then click Search to discover beautiful Philippine destinations!
        </Typography>
      </Box>
    );
  }

  // Download
  const handleDownload = async (imageUrl, photoId, e) => {
    e.stopPropagation();
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lakbay-photo-${photoId}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      window.open(imageUrl, '_blank');
    }
  };

  // Toggle Like
  const toggleLike = (photoId, e) => {
    e.stopPropagation();
    setLikedPhotos(prev => ({
      ...prev,
      [photoId]: !prev[photoId]
    }));
  };

  // Share
  const handleShare = (photo, e) => {
    e.stopPropagation();
    const shareText = `Look at this beautiful spot: ${photo.altText} — from PH Lakbay PH!`;
    if (navigator.share) {
      navigator.share({ title: 'PH Lakbay PH', text: shareText, url: photo.imageUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shareText}\n${photo.imageUrl}`);
      setShareNotice(true);
    }
  };

  return (
    <>
      <Snackbar 
        open={shareNotice} 
        autoHideDuration={3000} 
        onClose={() => setShareNotice(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ bgcolor: 'primary.main', color: 'white' }}>
          ✅ Copied to clipboard — Ready to share!
        </Alert>
      </Snackbar>

      <Dialog
        open={Boolean(selectedImage)}
        onClose={() => setSelectedImage(null)}
        maxWidth={false}
        PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', overflow: 'hidden', maxWidth: '95vw', maxHeight: '95vh' } }}
      >
        {selectedImage && (
          <Box sx={{ position: 'relative' }}>
            <IconButton onClick={() => setSelectedImage(null)} sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', zIndex: 1, '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}>
              <Close />
            </IconButton>
            <img src={selectedImage} alt="Full size view" style={{ maxWidth: '100%', maxHeight: '90vh', display: 'block', margin: '0 auto', borderRadius: '8px' }} />
          </Box>
        )}
      </Dialog>

      {/* ✅ 3 EQUAL COLUMNS — ALL FIXED SIZES */}
      <Grid container spacing={3} sx={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {photos.map((photo) => (
          <Grid item xs={12} sm={6} md={4} key={photo.id} sx={{ display: 'flex' }}>
            <Card 
              elevation={0}
              sx={{ 
                height: '340px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '24px',
                overflow: 'hidden',
                bgcolor: '#ffffff',
                boxShadow: '0 4px 20px rgba(45, 95, 63, 0.08)',
                transition: 'transform 0.3s ease',
                '&:hover': { transform: 'translateY(-4px)' }
              }}
            >
              {/* IMAGE — FIXED HEIGHT + COVER */}
              <Box
                onClick={() => setSelectedImage(photo.imageUrl)}
                sx={{
                  cursor: 'pointer',
                  position: 'relative',
                  width: '100%',
                  height: '220px',
                  minHeight: '220px',
                  maxHeight: '220px',
                  overflow: 'hidden',
                  flexShrink: 0
                }}
              >
                <CardMedia
                  component="img"
                  image={photo.imageUrl}
                  alt={photo.altText}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    display: 'block'
                  }}
                />
                <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.3s ease', '&:hover': { bgcolor: 'rgba(0,0,0,0.2)', '& .fullscreen-icon': { opacity: 1 } } }}>
                  <Fullscreen className="fullscreen-icon" sx={{ color: 'white', fontSize: 40, opacity: 0, transition: 'opacity 0.3s ease', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
                </Box>
              </Box>

              {/* BOTTOM — FIXED HEIGHT */}
              <CardContent sx={{ height: '120px', minHeight: '120px', maxHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2, overflow: 'hidden' }}>
                <Box>
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.8rem' }}>
                    📸 Captured by:
                  </Typography>
                  <Link href={photo.photographerUrl} target="_blank" rel="noopener noreferrer" sx={{ color: '#2d6b3f', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem', '&:hover': { textDecoration: 'underline' } }}>
                    {photo.photographer}
                  </Link>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <IconButton onClick={(e) => toggleLike(photo.id, e)} size="small" sx={{ color: likedPhotos[photo.id] ? '#e91e63' : '#4a7c59', padding: '4px' }}>
                    {likedPhotos[photo.id] ? <Favorite /> : <FavoriteBorder />}
                  </IconButton>
                  <IconButton onClick={(e) => handleShare(photo, e)} size="small" sx={{ color: '#00897b', padding: '4px' }}>
                    <Share />
                  </IconButton>
                  <IconButton onClick={(e) => handleDownload(photo.imageUrl, photo.id, e)} size="small" sx={{ color: '#2d6b3f', border: '1px solid #81c784', borderRadius: '50%', padding: '6px' }}>
                    <Download fontSize="small" />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
}