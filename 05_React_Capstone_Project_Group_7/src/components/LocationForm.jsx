import React, { useEffect, useState } from 'react';
import {
  Box,
  Autocomplete,
  TextField,
  Button,
  Stack,
  FormHelperText,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import {
  getRegions,
  getCitiesMunicipalitiesByRegion,
} from '../services/geoPhotoService';

export default function LocationForm({ onSearch }) {
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [error, setError] = useState('');
  const [loadingCities, setLoadingCities] = useState(false);

  // Load regions on mount
  useEffect(() => {
    const loadRegions = async () => {
      const data = await getRegions();
      setRegions(data);

      if (data.length === 0) {
        setError('Unable to load regions. Please refresh the page.');
      }
    };

    loadRegions();
  }, []);

  // Load cities when region changes
  useEffect(() => {
    let active = true;

    setCities([]);
    setSelectedCity(null);
    setError('');

    if (!selectedRegion) return;

    const loadCities = async () => {
      setLoadingCities(true);
      const data = await getCitiesMunicipalitiesByRegion(
        selectedRegion.code
      );

      if (active) {
        setCities(data);
        setLoadingCities(false);

        if (data.length === 0) {
          setError('No cities found. Please try another region.');
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

    if (!selectedCity) {
      setError('Please select a city or municipality.');
      return;
    }

    setError('');
    onSearch(selectedCity.name);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'stretch', sm: 'flex-start' }}
      >
        {/* Region — searchable */}
        <Autocomplete
          fullWidth
          size="small"
          options={regions}
          value={selectedRegion}
          onChange={(event, newValue) => setSelectedRegion(newValue)}
          getOptionLabel={(option) => option.name || ''}
          isOptionEqualToValue={(option, value) =>
            option.code === value?.code
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Region"
              placeholder="Type to search region..."
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: 3 },
              }}
            />
          )}
          autoHighlight
          clearOnBlur={false}
        />

        {/* City / Municipality — searchable */}
        <Autocomplete
          fullWidth
          size="small"
          disabled={!selectedRegion}
          loading={loadingCities}
          options={cities}
          value={selectedCity}
          onChange={(event, newValue) => setSelectedCity(newValue)}
          getOptionLabel={(option) => option.name || ''}
          isOptionEqualToValue={(option, value) =>
            option.code === value?.code
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select City / Municipality"
              placeholder={
                selectedRegion
                  ? 'Type to search city...'
                  : 'Select a region first'
              }
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: 3 },
              }}
            />
          )}
          autoHighlight
          clearOnBlur={false}
        />

        <Button
          type="submit"
          variant="contained"
          startIcon={<Search />}
          disabled={!selectedCity}
          sx={{
            minWidth: { sm: 130 },
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 'bold',
            py: 1.1,
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          }}
        >
          Search
        </Button>
      </Stack>

      {error && (
        <FormHelperText error sx={{ mt: 1.5, ml: 1 }}>
          {error}
        </FormHelperText>
      )}
    </Box>
  );
}