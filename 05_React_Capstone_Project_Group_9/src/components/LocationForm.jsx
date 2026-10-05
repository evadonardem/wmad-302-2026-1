import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Stack, TextField } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
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
    let cancelled = false;

    const loadRegions = async () => {
      try {
        const data = await getRegions();
        if (!cancelled) setRegions(data || []);
      } catch (err) {
        console.error('Failed to load regions:', err);
      }
    };

    loadRegions();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // TODO 2.3 [Reactive Cascading Refresh]
    setSelectedCityName('');
    setCities([]);
    if (!selectedRegion) return undefined;

    let cancelled = false;

    const loadCities = async () => {
      try {
        const data = await getCitiesMunicipalitiesByRegion(selectedRegion);
        if (!cancelled) setCities(data || []);
      } catch (err) {
        console.error('Failed to load cities/municipalities:', err);
      }
    };

    loadCities();
    return () => {
      cancelled = true;
    };
  }, [selectedRegion]);

  // City / municipality names of the chosen region (no duplicates, A to Z)
  const cityNames = useMemo(
    () => [...new Set(cities.map((c) => c.name))].sort((a, b) => a.localeCompare(b)),
    [cities]
  );

  // The region object that matches the chosen code (null when nothing is chosen)
  const regionValue = regions.find((r) => r.code === selectedRegion) || null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO 2.4 [Form Submit Bubble]
    if (selectedCityName) onSearch(selectedCityName);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mb: 4 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'center' }}>

        {/* TODO 2.5 / 2.6 [Region]: click to open the list, or type to narrow it down (e.g. "bic" -> Bicol Region) */}
        <Autocomplete
          fullWidth
          size="small"
          autoHighlight
          openOnFocus
          options={regions}
          value={regionValue}
          getOptionLabel={(option) => option.name || ''}
          isOptionEqualToValue={(option, value) => option.code === value.code}
          onChange={(e, newValue) => setSelectedRegion(newValue ? newValue.code : '')}
          noOptionsText="No region found"
          renderInput={(params) => <TextField {...params} label="Select Region" />}
          sx={{ '& .MuiAutocomplete-input': { textAlign: 'center' } }}
        />

        {/* TODO 2.7 / 2.8 [City / Municipality]: type to narrow it down (e.g. "man" -> Mankayan) */}
        <Autocomplete
          fullWidth
          size="small"
          autoHighlight
          openOnFocus
          disabled={!selectedRegion}
          options={cityNames}
          value={selectedCityName || null}
          onChange={(e, newValue) => setSelectedCityName(newValue || '')}
          noOptionsText="No city or municipality found"
          renderInput={(params) => <TextField {...params} label="Select City / Municipality" />}
          sx={{ '& .MuiAutocomplete-input': { textAlign: 'center' } }}
        />

        <Button
          type="submit"
          variant="contained"
          startIcon={<Search />}
          disabled={!selectedCityName}
          sx={{ textTransform: 'none', px: 4, flexShrink: 0 }}
        >
          Search
        </Button>
      </Stack>
    </Box>
  );
}