import React, { useEffect, useState } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Button, Stack } from '@mui/material';
import { Search } from '@mui/icons-material';
import { getRegions, getCitiesMunicipalitiesByRegion } from '../services/geoPhotoService';

export default function LocationForm({ onSearch }) {
  // TODO 2.1 [State Trackers]
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCityName, setSelectedCityName] = useState('');

  useEffect(() => {
    // TODO 2.2 [Initial Data Populate]
    const loadRegions = async () => {
      try {
        const data = await getRegions();
        setRegions(data);
      } catch (error) {
        console.error(error);
      }
    };
    loadRegions();
  }, []);

  useEffect(() => {
    // TODO 2.3 [Reactive Cascading Refresh]
    // Always reset the child selection when the region changes
    setSelectedCityName('');
    setCities([]);
    if (!selectedRegion) return;

    // "cancelled" stops an old, slow request from overwriting a newer one
    let cancelled = false;
    const loadCities = async () => {
      try {
        const data = await getCitiesMunicipalitiesByRegion(selectedRegion);
        if (!cancelled) setCities(data);
      } catch (error) {
        console.error(error);
      }
    };
    loadCities();
    return () => {
      cancelled = true;
    };
  }, [selectedRegion]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO 2.4 [Form Submit Bubble]
    onSearch(selectedCityName);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mb: 4 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">

        <FormControl fullWidth size="small">
          <InputLabel id="region-label">Select Region</InputLabel>
          {/* TODO 2.5 [Controlled Parent Select] */}
          <Select
            labelId="region-label"
            label="Select Region"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            {/* TODO 2.6 [Region Menu Map] */}
            {regions.map((region) => (
              <MenuItem key={region.code} value={region.code}>
                {region.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small" disabled={!selectedRegion}>
          <InputLabel id="city-label">Select City / Municipality</InputLabel>
          { /* TODO 2.7 [Controlled Child Select] */}
          <Select
            labelId="city-label"
            label="Select City / Municipality"
            value={selectedCityName}
            onChange={(e) => setSelectedCityName(e.target.value)}
          >
            { /* TODO 2.8 [City Menu Map] */}
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
          sx={{ textTransform: 'none', px: 4 }}
        >
          Search
        </Button>
      </Stack>
    </Box>
  );
}