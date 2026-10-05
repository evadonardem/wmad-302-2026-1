import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Link,
  Skeleton,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  Button,
} from '@mui/material';
import {
  CameraAlt,
  LocationOn,
  Close,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';

export default function MediaGallery({ photos, loading, locationName }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Number of photos shown on each page
  const photosPerPage = 12;

  // Calculate total number of pages
  const totalPages = Math.ceil(photos.length / photosPerPage);

  // Get the photos for the current page
  const startIndex = (currentPage - 1) * photosPerPage;
  const currentPhotos = photos.slice(
    startIndex,
    startIndex + photosPerPage
  );

  // Reset to Page 1 whenever a new search result is loaded
  useEffect(() => {
    setCurrentPage(1);
  }, [photos]);

  // TODO 3.1 [Loading Skeletal Feedbacks]: Show Skeleton cards while loading.
  if (loading) {
    return (
      <Box
        sx={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 3,
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Card
            key={item}
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              width: '100%',
            }}
          >
            <Skeleton variant="rectangular" height={260} />

            <Box sx={{ p: 2 }}>
              <Skeleton width="60%" />
              <Skeleton width="40%" />
            </Box>
          </Card>
        ))}
      </Box>
    );
  }

  // Show a welcome message before the user performs a search
  if (!locationName) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 8,
          px: 3,
          borderRadius: 4,
          backgroundColor: 'background.paper',
        }}
      >
        <LocationOn
          sx={{
            fontSize: 55,
            color: 'primary.main',
            mb: 2,
          }}
        />

        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '1.7rem', sm: '2rem' },
            letterSpacing: '-0.8px',
            color: 'text.primary',
            lineHeight: 1.2,
          }}
        >
          Discover Somewhere New
        </Typography>

        <Typography
          variant="body1"
          sx={{
            mt: 1.5,
            maxWidth: 520,
            mx: 'auto',
            color: 'text.secondary',
            fontSize: { xs: '0.95rem', sm: '1rem' },
            lineHeight: 1.7,
            letterSpacing: '0.1px',
          }}
        >
          Select a city or municipality above and uncover tourist spots worth exploring.
        </Typography>
      </Box>
    );
  }

  // TODO 3.2 [Boundary Validation Checks]: Show a fallback when no photos are found.
  if (!photos || photos.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 8,
          px: 3,
          borderRadius: 4,
          backgroundColor: 'background.paper',
        }}
      >
        <CameraAlt
          sx={{
            fontSize: 55,
            color: 'text.secondary',
            mb: 2,
          }}
        />

        <Typography variant="h6" fontWeight="bold">
          No tourist spots found for this area yet.
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1 }}
        >
          Try selecting another city or municipality.
        </Typography>
      </Box>
    );
  }

  // Find the current photo position for the overlay
  const selectedIndex = selectedPhoto
    ? photos.findIndex((photo) => photo.id === selectedPhoto.id)
    : -1;

  const handlePrevious = () => {
    if (selectedIndex > 0) {
      setSelectedPhoto(photos[selectedIndex - 1]);
    }
  };

  const handleNext = () => {
    if (selectedIndex < photos.length - 1) {
      setSelectedPhoto(photos[selectedIndex + 1]);
    }
  };

  // Handle gallery page navigation
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Gallery Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 3,
          px: { xs: 1, sm: 0 },
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="overline"
            color="primary"
            fontWeight="bold"
            letterSpacing={2}
          >
            TRAVEL SNAPSHOTS
          </Typography>

          <Typography
            variant="h5"
            sx={{
              mt: 0.5,
              fontFamily: 'Georgia, serif',
              fontWeight: 600,
              fontStyle: 'italic',
              color: 'text.primary',
            }}
          >
            {locationName
              ? `Discover ${locationName}`
              : 'Places to Explore'}
          </Typography>
        </Box>

        <Chip
          icon={<LocationOn />}
          label={`${photos.length} photos`}
          variant="outlined"
          color="primary"
        />
      </Box>

      {/* TODO 3.3 [Fluid Layout Architecture]: Create a responsive photo grid. */}
      <Box
        sx={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 3,
        }}
      >
        {/* TODO 3.4 [Card Content Loop Mapping]: Display each photo as a card. */}
        {currentPhotos.map((photo, index) => {
          // Use the specific tourist place name.
          // Fall back to the selected city if no place name is available.
          const specificPlace = photo.placeName || locationName;

          return (
            <Card
              key={photo.id}
              elevation={0}
              sx={{
                width: '100%',
                height: '100%',
                borderRadius: 4,
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'background.paper',
                transition: 'all 0.3s ease',

                '&:hover': {
                  transform: 'translateY(-6px)',
                  boxShadow: '0 16px 35px rgba(23, 107, 99, 0.15)',
                  borderColor: 'primary.main',
                },
              }}
            >
              {/* TODO 3.5 [Multimedia Presentation Layer]: Display the photo using CardMedia. */}
              <Box
                onClick={() => setSelectedPhoto(photo)}
                sx={{
                  display: 'block',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <CardMedia
                  component="img"
                  image={photo.imageUrl}
                  alt={photo.altText}
                  sx={{
                    width: '100%',
                    height: 260,
                    objectFit: 'cover',
                    display: 'block',
                    transition: 'transform 0.5s ease',

                    '&:hover': {
                      transform: 'scale(1.06)',
                    },
                  }}
                />

                {/* Location Overlay - location appears only here */}
                <Box
                  component="a"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${specificPlace}, ${locationName}, Philippines`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    position: 'absolute',
                    bottom: 12,
                    left: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.7,
                    px: 1.5,
                    py: 0.7,
                    borderRadius: 2,
                    backgroundColor: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(6px)',
                    color: 'white',
                    zIndex: 2,
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',

                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    },
                  }}
                >
                  <LocationOn sx={{ fontSize: 17 }} />

                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      lineHeight: 1,
                      color: 'white',
                    }}
                  >
                    {specificPlace}
                  </Typography>
                </Box>

                {/* Featured photo on each page */}
                {index === 0 && (
                  <Chip
                    label="FEATURED"
                    size="small"
                    color="secondary"
                    sx={{
                      position: 'absolute',
                      top: 14,
                      left: 14,
                      fontWeight: 800,
                      borderRadius: 2,
                      backdropFilter: 'blur(6px)',
                    }}
                  />
                )}
              </Box>

              <CardContent
                sx={{
                  p: 2.5,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 145,
                }}
              >
                {/* Image Description - location removed from here */}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {photo.altText}
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mt: 'auto',
                  }}
                >
                  <CameraAlt
                    sx={{
                      fontSize: 18,
                      color: 'primary.main',
                    }}
                  />

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Captured by
                  </Typography>

                  {/* TODO 3.6 [Attribution Links]: Link to the photographer's profile. */}
                  <Link
                    href={photo.photographerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    sx={{
                      fontWeight: 700,
                      color: 'primary.main',
                      fontSize: '0.8rem',
                    }}
                  >
                    {photo.photographer}
                  </Link>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Gallery Page Navigation */}
      {totalPages > 1 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2,
            mt: 4,
            mb: 2,
            flexWrap: 'wrap',
          }}
        >
          <Button
            variant="outlined"
            startIcon={<ChevronLeft />}
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
            }}
          >
            Previous Page
          </Button>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontWeight: 700,
              minWidth: 80,
              textAlign: 'center',
            }}
          >
            Page {currentPage} of {totalPages}
          </Typography>

          <Button
            variant="contained"
            endIcon={<ChevronRight />}
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
            }}
          >
            Next Page
          </Button>
        </Box>
      )}

      {/* Photo Preview Overlay */}
      <Dialog
        open={Boolean(selectedPhoto)}
        onClose={() => setSelectedPhoto(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            backgroundColor: 'background.paper',
          },
        }}
      >
        {selectedPhoto && (
          <>
            {/* Close Button */}
            <IconButton
              onClick={() => setSelectedPhoto(null)}
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 3,
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.55)',

                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                },
              }}
            >
              <Close />
            </IconButton>

            <DialogContent
              sx={{
                p: 0,
                position: 'relative',
              }}
            >
              {/* Large Photo */}
              <Box
                component="img"
                src={selectedPhoto.imageUrl}
                alt={selectedPhoto.altText}
                sx={{
                  display: 'block',
                  width: '100%',
                  maxHeight: '65vh',
                  objectFit: 'contain',
                  backgroundColor: 'black',
                }}
              />

              {/* Previous Arrow */}
              <IconButton
                onClick={handlePrevious}
                disabled={selectedIndex === 0}
                sx={{
                  position: 'absolute',
                  left: 15,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'white',
                  backgroundColor: 'rgba(0, 0, 0, 0.55)',

                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  },

                  '&.Mui-disabled': {
                    color: 'rgba(255,255,255,0.3)',
                    backgroundColor: 'rgba(0,0,0,0.25)',
                  },
                }}
              >
                <ChevronLeft />
              </IconButton>

              {/* Next Arrow */}
              <IconButton
                onClick={handleNext}
                disabled={selectedIndex === photos.length - 1}
                sx={{
                  position: 'absolute',
                  right: 15,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'white',
                  backgroundColor: 'rgba(0, 0, 0, 0.55)',

                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  },

                  '&.Mui-disabled': {
                    color: 'rgba(255,255,255,0.3)',
                    backgroundColor: 'rgba(0,0,0,0.25)',
                  },
                }}
              >
                <ChevronRight />
              </IconButton>

              {/* Photo Information */}
              <Box
                sx={{
                  p: 3,
                  backgroundColor: 'background.paper',
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight={800}
                  sx={{
                    color: 'text.primary',
                    mb: 1,
                  }}
                >
                  {selectedPhoto.placeName || locationName}
                </Typography>

                {/* Image Description */}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    lineHeight: 1.6,
                  }}
                >
                  {selectedPhoto.altText}
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 2,
                    flexWrap: 'wrap',
                  }}
                >
                  <LocationOn
                    sx={{
                      fontSize: 19,
                      color: 'primary.main',
                    }}
                  />

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {selectedPhoto.placeName || locationName}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 2,
                    flexWrap: 'wrap',
                  }}
                >
                  <CameraAlt
                    sx={{
                      fontSize: 19,
                      color: 'primary.main',
                    }}
                  />

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Captured by
                  </Typography>

                  <Link
                    href={selectedPhoto.photographerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    sx={{
                      fontWeight: 700,
                      color: 'primary.main',
                    }}
                  >
                    {selectedPhoto.photographer}
                  </Link>
                </Box>

                {/* Photo Counter */}
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    textAlign: 'center',
                    mb: 2,
                  }}
                >
                  {selectedIndex + 1} of {photos.length}
                </Typography>

                {/* Previous / Next Photo Buttons */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 2,
                  }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<ChevronLeft />}
                    onClick={handlePrevious}
                    disabled={selectedIndex === 0}
                    sx={{
                      textTransform: 'none',
                      borderRadius: 2,
                    }}
                  >
                    Previous
                  </Button>

                  <Button
                    variant="contained"
                    endIcon={<ChevronRight />}
                    onClick={handleNext}
                    disabled={selectedIndex === photos.length - 1}
                    sx={{
                      textTransform: 'none',
                      borderRadius: 2,
                    }}
                  >
                    Next
                  </Button>
                </Box>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}