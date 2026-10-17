import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardMedia,
  Typography,
  Link,
  Skeleton,
  Modal,
  IconButton,
  Backdrop,
  Fade,
} from '@mui/material';
import { 
  CameraAlt, 
  Person, 
  Close, 
  ArrowBackIosNew, 
  ArrowForwardIos,
  Favorite,
  FavoriteBorder
} from '@mui/icons-material';

export default function MediaGallery({ photos, loading }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  
  // State para sa mga naka-like na photos (galing sa localStorage)
  const [likedPhotos, setLikedPhotos] = useState(() => {
    const saved = localStorage.getItem('techcare_likes');
    return saved ? JSON.parse(saved) : [];
  });

  // I-save sa localStorage tuwing may babaguhin sa likes
  useEffect(() => {
    localStorage.setItem('techcare_likes', JSON.stringify(likedPhotos));
  }, [likedPhotos]);

  const handleToggleLike = (e, photoId) => {
    e.stopPropagation(); // Para hindi mag-open yung modal kapag pinindot yung heart
    setLikedPhotos((prev) => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId) // Unlike
        : [...prev, photoId] // Like
    );
  };

  const handleOpen = (index) => setSelectedIndex(index);
  const handleClose = () => setSelectedIndex(null);

  const handleNext = (e) => {
    e?.stopPropagation();
    setSelectedIndex((prevIndex) => (prevIndex + 1) % photos.length);
  };

  const handlePrev = (e) => {
    e?.stopPropagation();
    setSelectedIndex((prevIndex) => (prevIndex - 1 + photos.length) % photos.length);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (selectedIndex === null) return;
      if (event.key === 'ArrowRight') handleNext();
      if (event.key === 'ArrowLeft') handlePrev();
      if (event.key === 'Escape') handleClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, photos.length]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 3,
        }}
      >
        {[1, 2, 3, 4].map((item) => (
          <Skeleton key={item} variant="rounded" height={280} sx={{ borderRadius: 4 }} />
        ))}
      </Box>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <Box
        sx={{
          minHeight: 220,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          p: 4,
          borderRadius: 4,
          border: '2px dashed',
          borderColor: 'divider',
          bgcolor: 'action.hover',
        }}
      >
        <CameraAlt sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
          No tourist spots found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Try searching for a different city or municipality above.
        </Typography>
      </Box>
    );
  }

  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null;
  const isSelectedPhotoLiked = selectedPhoto ? likedPhotos.includes(selectedPhoto.id) : false;

  return (
    <>
      {/* GRID NG MGA PICTURES */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 3,
        }}
      >
        {photos.map((photo, index) => {
          const isLiked = likedPhotos.includes(photo.id);

          return (
            <Card
              key={photo.id}
              onClick={() => handleOpen(index)}
              sx={{
                position: 'relative',
                height: 280,
                borderRadius: 4,
                overflow: 'hidden',
                cursor: 'pointer',
                border: 'none',
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  boxShadow: '0 20px 30px rgba(0,0,0,0.15)',
                  '& .MuiCardMedia-root': { transform: 'scale(1.05)' },
                },
              }}
            >
              <CardMedia
                component="img"
                image={photo.imageUrl}
                alt={photo.altText}
                loading="lazy"
                sx={{
                  height: '100%',
                  width: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.4s ease',
                }}
              />

              {/* LIKE BUTTON SA CARD */}
              <IconButton
                onClick={(e) => handleToggleLike(e, photo.id)}
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  zIndex: 2,
                  bgcolor: 'rgba(0,0,0,0.3)',
                  color: isLiked ? '#ef4444' : '#fff', // Red kung liked, white kung hindi
                  backdropFilter: 'blur(5px)',
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.6)', transform: 'scale(1.1)' },
                }}
              >
                {isLiked ? <Favorite /> : <FavoriteBorder />}
              </IconButton>

              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
                  pt: 6,
                  pb: 2,
                  px: 2.5,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                }}
              >
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <CameraAlt sx={{ fontSize: 14 }} /> Photo by
                </Typography>

                <Typography variant="subtitle2" noWrap sx={{ color: '#fff', fontWeight: 600 }}>
                  <Link
                    href={photo.photographerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    onClick={(e) => e.stopPropagation()}
                    sx={{ color: 'inherit', display: 'flex', alignItems: 'center', gap: 0.5 }}
                  >
                    <Person sx={{ fontSize: 16 }} />
                    {photo.photographer}
                  </Link>
                </Typography>
              </Box>
            </Card>
          );
        })}
      </Box>

      {/* MODAL FULLSCREEN */}
      <Modal
        open={selectedIndex !== null}
        onClose={handleClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
          sx: { backdropFilter: 'blur(10px)', backgroundColor: 'rgba(0,0,0,0.95)' },
        }}
      >
        <Fade in={selectedIndex !== null}>
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
            }}
          >
            {/* Close Button */}
            <IconButton
              onClick={handleClose}
              sx={{
                position: 'absolute',
                top: 20,
                right: 20,
                zIndex: 20,
                color: '#fff',
                bgcolor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(5px)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              }}
            >
              <Close fontSize="large" />
            </IconButton>

            <Box
              sx={{
                position: 'relative',
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Malaking Picture - FULL SCREEN */}
              <Box
                component="img"
                src={selectedPhoto?.imageUrl}
                alt={selectedPhoto?.altText}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  userSelect: 'none',
                }}
              />

              {/* Previous Arrow */}
              <IconButton
                onClick={handlePrev}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: 30,
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  color: '#fff',
                  bgcolor: 'rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(5px)',
                  p: 2,
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.8)', transform: 'translateY(-50%) scale(1.1)' },
                  transition: 'all 0.2s',
                }}
              >
                <ArrowBackIosNew fontSize="large" />
              </IconButton>

              {/* Next Arrow */}
              <IconButton
                onClick={handleNext}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  right: 30,
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  color: '#fff',
                  bgcolor: 'rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(5px)',
                  p: 2,
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.8)', transform: 'translateY(-50%) scale(1.1)' },
                  transition: 'all 0.2s',
                }}
              >
                <ArrowForwardIos fontSize="large" />
              </IconButton>
            </Box>

            {/* Caption Bar (Floating sa ilalim) */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)',
                p: { xs: 3, md: 5 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                pointerEvents: 'none',
                zIndex: 5,
              }}
            >
              <Box sx={{ pointerEvents: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff', textShadow: '1px 1px 4px rgba(0,0,0,0.8)', maxWidth: '80vw' }}>
                    {selectedPhoto?.altText || 'Tourist Spot'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <CameraAlt fontSize="small" /> Captured by{' '}
                    <Link href={selectedPhoto?.photographerUrl} target="_blank" rel="noopener noreferrer" sx={{ color: '#facc15', fontWeight: 'bold' }}>
                      {selectedPhoto?.photographer}
                    </Link>
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                   {/* LIKE BUTTON SA MODAL */}
                  <IconButton
                    onClick={(e) => selectedPhoto && handleToggleLike(e, selectedPhoto.id)}
                    sx={{
                      color: isSelectedPhotoLiked ? '#ef4444' : '#fff',
                      bgcolor: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(5px)',
                      mb: 1,
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.2)', transform: 'scale(1.1)' },
                    }}
                  >
                    {isSelectedPhotoLiked ? <Favorite fontSize="large" /> : <FavoriteBorder fontSize="large" />}
                  </IconButton>
                  <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.6)', textAlign: 'right' }}>
                    {selectedIndex + 1} / {photos.length}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}