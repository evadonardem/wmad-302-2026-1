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
} from '@mui/material';
import { Search } from '@mui/icons-material';
import {
  getRegions,
  getCitiesMunicipalitiesByRegion,
} from '../services/geoPhotoService';

export default function LocationForm({ onSearch }) {
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCityName, setSelectedCityName] = useState('');
  const [error, setError] = useState('');

  // Load regions when the component opens
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

  // Load cities whenever the selected region changes
  useEffect(() => {
    let active = true;

    setCities([]);
    setSelectedCityName('');
    setError('');

    if (!selectedRegion) return;

    const loadCities = async () => {
      const data = await getCitiesMunicipalitiesByRegion(
        selectedRegion
      );

      if (active) {
        setCities(data);

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

  // Submit the selected city to App.jsx
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
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
      >
        <FormControl fullWidth size="small">
          <InputLabel id="region-label">
            Select Region
          </InputLabel>

          <Select
            labelId="region-label"
            value={selectedRegion}
            label="Select Region"
            onChange={(event) =>
              setSelectedRegion(event.target.value)
            }
            sx={{ borderRadius: 3, textAlign: 'left' }}
          >
            {regions.map((region) => (
              <MenuItem key={region.code} value={region.code}>
                {region.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl
          fullWidth
          size="small"
          disabled={!selectedRegion}
        >
          <InputLabel id="city-label">
            Select City / Municipality
          </InputLabel>

          <Select
            labelId="city-label"
            value={selectedCityName}
            label="Select City / Municipality"
            onChange={(event) =>
              setSelectedCityName(event.target.value)
            }
            sx={{ borderRadius: 3, textAlign: 'left' }}
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
          disabled={!selectedCityName}
          sx={{
            minWidth: { sm: 120 },
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 'bold',
            boxShadow: 'none',
          }}
        >
          Search
        </Button>
      </Stack>

      {error && (
        <FormHelperText error sx={{ mt: 1.5 }}>
          {error}
        </FormHelperText>
      )}
    </Box>
  );
}