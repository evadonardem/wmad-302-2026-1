import { useEffect, useState } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Button, Stack } from '@mui/material';
import { Search } from '@mui/icons-material';
import { getRegions, getCitiesMunicipalitiesByRegion } from '../services/geoPhotoService';

export default function LocationForm({ onSearch }) {
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCityName, setSelectedCityName] = useState('');

  useEffect(() => {
    let active = true;

    getRegions().then((data) => {
      if (active) {
        setRegions(data);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedRegion) {
      return undefined;
    }

    let active = true;
    getCitiesMunicipalitiesByRegion(selectedRegion).then((data) => {
      if (active) {
        setCities(data);
      }
    });

    return () => {
      active = false;
    };
  }, [selectedRegion]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedCityName) {
      onSearch(selectedCityName);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mb: 4 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'center' }}>
        
        <FormControl fullWidth size="small">
          <InputLabel id="region-label">Select Region</InputLabel>
          <Select
            labelId="region-label"
            label="Select Region"
            value={selectedRegion}
            onChange={(e) => {
              setSelectedRegion(e.target.value);
              setSelectedCityName('');
              setCities([]);
            }}
          >
            {regions.map((region) => (
              <MenuItem key={region.code} value={region.code}>
                {region.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small" disabled={!selectedRegion}>
          <InputLabel id="city-label">Select City / Municipality</InputLabel>
          <Select
            labelId="city-label"
            label="Select City / Municipality"
            value={selectedCityName}
            onChange={(e) => setSelectedCityName(e.target.value)}
          >
            {cities.map((city) => (
              <MenuItem key={city.code ?? city.id} value={city.name}>
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
          sx={{ textTransform: 'none', px: 4 }}
        >
          Search
        </Button>
      </Stack>
    </Box>
  );
}