import React, { useEffect, useState } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Button, Stack } from '@mui/material';
import { Search } from '@mui/icons-material';
import { getRegions, getCitiesMunicipalitiesByRegion } from '../services/geoPhotoService';

export default function LocationForm({ onSearch }) {
  // TODO 2.1 [State Trackers]: Initialize four separate local state layers:
  // - 'regions': Stores array of all regions (default: empty array)
  // - 'cities': Stores array of filtered sub-municipalities (default: empty array)
  // - 'selectedRegion': String tracking the chosen active region code (default: empty string)
  // - 'selectedCityName': String tracking the actual chosen city text name to feed the search keyword engine (default: empty string)
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCityName, setSelectedCityName] = useState('');
  // TODO PERF 1: Loading indicator state for cities dropdown
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  useEffect(() => {
    // TODO 2.2 [Initial Data Populate]: Invoke the 'getRegions' service function asynchronously inside a mounting side-effect.
    const loadRegions = async () => {
      const data = await getRegions();
      setRegions(data);
    };
    loadRegions();
  }, []);

  useEffect(() => {
    // TODO 2.3 [Reactive Cascading Refresh]: Trigger an asynchronous refresh whenever 'selectedRegion' changes.
    const loadCities = async () => {
      if (!selectedRegion) return;
      
      setSelectedCityName('');
      setCities([]);
      // TODO PERF 2: Show loading message while fetching
      setIsLoadingCities(true);
      
      try {
        const data = await getCitiesMunicipalitiesByRegion(selectedRegion);
        setCities(data);
      } catch (error) {
        console.error('Failed to load cities:', error);
      } finally {
        // TODO PERF 3: Hide loading when done (success OR error)
        setIsLoadingCities(false);
      }
    };
    loadCities();
  }, [selectedRegion]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(selectedCityName);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Stack direction="column" spacing={3}>
        
        <FormControl fullWidth>
          <InputLabel id="region-label">Select Region</InputLabel>
          <Select
            labelId="region-label"
            label="Select Region"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            {regions.map((region) => (
              <MenuItem key={region.code} value={region.code}>
                {region.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* TODO PERF 4: Dynamic label changes to "Loading..." while fetching */}
        <FormControl fullWidth disabled={!selectedRegion || isLoadingCities}>
          <InputLabel id="city-label">
            {isLoadingCities ? '⏳ Loading cities...' : 'Select City / Municipality'}
          </InputLabel>
          <Select
            labelId="city-label"
            label={isLoadingCities ? '⏳ Loading cities...' : 'Select City / Municipality'}
            value={selectedCityName}
            onChange={(e) => setSelectedCityName(e.target.value)}
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
          sx={{ textTransform: 'none', py: 1.5, fontSize: '1rem' }}
          fullWidth
        >
          Search
        </Button>
        
      </Stack>
    </Box>
  );
}