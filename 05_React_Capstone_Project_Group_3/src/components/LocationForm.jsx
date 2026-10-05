import React, { useEffect, useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import {
  getRegions,
  getCitiesMunicipalitiesByRegion,
} from '../services/geoPhotoService';

const selectSx = {
  borderRadius: 3,
  textAlign: 'left',
  bgcolor: 'background.paper',
};

const menuProps = {
  PaperProps: { sx: { maxHeight: 320, borderRadius: 3, mt: 0.5 } },
};

export default function LocationForm({ onSearch }) {
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCityName, setSelectedCityName] = useState('');

  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadRegions = async () => {
      setLoadingRegions(true);
      const data = await getRegions();
      setRegions(data);
      setLoadingRegions(false);

      if (data.length === 0) {
        setError('Unable to load regions. Please refresh the page.');
      }
    };

    loadRegions();
  }, []);

  useEffect(() => {
    let active = true;

    setCities([]);
    setSelectedCityName('');
    setError('');

    if (!selectedRegion) return;

    const loadCities = async () => {
      setLoadingCities(true);
      const data = await getCitiesMunicipalitiesByRegion(selectedRegion);

      if (active) {
        setCities(data);
        setLoadingCities(false);

        if (data.length === 0) {
          setError('No cities or municipalities found for this region.');
        }
      }
    };

    loadCities();

    return () => {
      active = false;
    };
  }, [selectedRegion]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedCityName) {
      setError('Please select a city or municipality.');
      return;
    }

    setError('');
    onSearch(selectedCityName);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={1.5}>
        <FormControl fullWidth disabled={loadingRegions}>
          <InputLabel id="region-label">Select Region</InputLabel>
          <Select
            labelId="region-label"
            value={selectedRegion}
            label="Select Region"
            onChange={(e) => setSelectedRegion(e.target.value)}
            sx={selectSx}
            MenuProps={menuProps}
            endAdornment={
              loadingRegions && <CircularProgress size={20} sx={{ mr: 2 }} />
            }
          >
            {regions.map((region) => (
              <MenuItem key={region.code} value={region.code}>
                {region.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={!selectedRegion || loadingCities}>
          <InputLabel id="city-label">Select City / Municipality</InputLabel>
          <Select
            labelId="city-label"
            value={selectedCityName}
            label="Select City / Municipality"
            onChange={(e) => setSelectedCityName(e.target.value)}
            sx={selectSx}
            MenuProps={menuProps}
            endAdornment={
              loadingCities && <CircularProgress size={20} sx={{ mr: 2 }} />
            }
          >
            {cities.map((city) => (
              <MenuItem key={city.code} value={city.name}>
                {city.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          type="submit"
          variant="contained"
          startIcon={<Search />}
          disabled={!selectedCityName || loadingCities}
          sx={{
            height: 56,
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 'bold',
            fontSize: '1rem',
            boxShadow: 'none',
            color: '#f8ece6',
            bgcolor: 'rgba(255, 255, 255, 0.16)',
            border: '1px solid rgba(248, 236, 230, 0.45)',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.26)',
              boxShadow: 'none',
            },
            '&.Mui-disabled': {
              color: 'rgba(248, 236, 230, 0.75)',
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(248, 236, 230, 0.22)',
            },
          }}
        >
          Search
        </Button>
      </Stack>

      {error && (
        <FormHelperText
          role="alert"
          sx={{ mt: 1.5, color: '#ffd1d1', textAlign: 'left' }}
        >
          {error}
        </FormHelperText>
      )}
    </Box>
  );
}