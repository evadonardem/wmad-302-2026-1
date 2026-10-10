import React, { useEffect, useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  Chip,
  Typography,
} from '@mui/material';
import { Search, Map, LocationOn, Whatshot } from '@mui/icons-material';
import {
  getRegions,
  getCitiesMunicipalitiesByRegion,
} from '../services/geoPhotoService';

export default function LocationForm({ onSearch }) {
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCityName, setSelectedCityName] = useState('');

  // Trending spots quick shortcuts
  const trendingSpots = ['Baguio City', 'El Nido', 'Boracay', 'Siargao', 'Cebu City'];

  useEffect(() => {
    const fetchRegionsData = async () => {
      const data = await getRegions();
      setRegions(data);
    };
    fetchRegionsData();
  }, []);

  useEffect(() => {
    const fetchCitiesData = async () => {
      if (selectedRegion) {
        const data = await getCitiesMunicipalitiesByRegion(selectedRegion);
        setCities(data);
      } else {
        setCities([]);
      }
      setSelectedCityName('');
    };
    fetchCitiesData();
  }, [selectedRegion]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedCityName && onSearch) {
      onSearch(selectedCityName);
    }
  };

  const handleQuickSearch = (spot) => {
    if (onSearch) {
      onSearch(spot);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'center', alignItems: 'center' }}
      >
        {/* Region Dropdown */}
        <FormControl fullWidth size="medium">
          <InputLabel id="region-label">Select Region</InputLabel>
          <Select
            labelId="region-label"
            label="Select Region"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            sx={{ borderRadius: 3 }}
          >
            {regions.map((region) => (
              <MenuItem key={region.code || region.psgcCode} value={region.code}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Map color="primary" fontSize="small" />
                  {region.name}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* City / Municipality Dropdown */}
        <FormControl fullWidth size="medium" disabled={!selectedRegion}>
          <InputLabel id="city-label">Select City / Municipality</InputLabel>
          <Select
            labelId="city-label"
            label="Select City / Municipality"
            value={selectedCityName}
            onChange={(e) => setSelectedCityName(e.target.value)}
            sx={{ borderRadius: 3 }}
          >
            {cities.map((city) => (
              <MenuItem key={city.code || city.psgc10DigitCode || city.name} value={city.name}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn color="primary" fontSize="small" />
                  {city.name}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Search Submit Button */}
        <Button
          type="submit"
          variant="contained"
          size="large"
          startIcon={<Search />}
          disabled={!selectedCityName}
          sx={{
            minWidth: { xs: '100%', md: '160px' },
            height: '56px',
            borderRadius: 3,
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 600,
            boxShadow: '0 4px 14px 0 rgba(15, 76, 129, 0.39)',
          }}
        >
          Search
        </Button>
      </Stack>

      {/* Trending Spots Quick Click Chips */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2.5, flexWrap: 'wrap' }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Whatshot fontSize="small" color="error" /> Trending Spots:
        </Typography>
        {trendingSpots.map((spot) => (
          <Chip
            key={spot}
            label={spot}
            size="small"
            clickable
            onClick={() => handleQuickSearch(spot)}
            variant="outlined"
            sx={{
              borderRadius: 2,
              fontSize: '0.75rem',
              '&:hover': { backgroundColor: 'action.hover' },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}