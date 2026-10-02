import React, { useEffect, useState } from 'react';
import {Box,FormControl,InputLabel,Select,MenuItem,Button,Stack,InputAdornment,FormHelperText,} from '@mui/material';
import { Search, Public, LocationCity } from '@mui/icons-material';
import { getRegions, getCitiesMunicipalitiesByRegion } from '../services/geoPhotoService';

export default function LocationForm({ onSearch }) {
  // TODO 2.1 [State Trackers]: Initialize four separate local state layers:
  // - 'regions': Stores array of all regions (default: empty array)
  // - 'cities': Stores array of filtered sub-municipalities (default: empty array)
  // - 'selectedRegion': String tracking the chosen active region code (default: empty string)
  // - 'selectedCityName': String tracking the actual chosen city text name to feed the search keyword engine (default: empty string)
  // [Your code here]

  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCityName, setSelectedCityName] = useState('');
  const [citiesLoading, setCitiesLoading] = useState(false);

  useEffect(() => {
    // TODO 2.2 [Initial Data Populate]: Invoke the 'getRegions' service function asynchronously inside a mounting side-effect.
    // Set the returned collection smoothly into your local regions state layer.
    // [Your code here]

    let cancelled = false;

    const loadRegions = async () => {
      const data = await getRegions();
      if (!cancelled) setRegions(data);
    };

    loadRegions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // TODO 2.3 [Reactive Cascading Refresh]: Trigger an asynchronous refresh whenever 'selectedRegion' changes.
    // If selectedRegion is a valid code, call 'getCitiesMunicipalitiesByRegion(selectedRegion)' and load the cities list state.
    // CRITICAL: Reset your 'selectedCityName' tracking states back to an empty string to keep inputs contextually clean!
    // [Your code here]

    setSelectedCityName('');
    setCities([]);

    if (!selectedRegion) return;

    // 'cancelled' guards against race conditions when the user switches regions quickly
    let cancelled = false;

    const loadCities = async () => {
      setCitiesLoading(true);
      const data = await getCitiesMunicipalitiesByRegion(selectedRegion);
      if (!cancelled) {
        setCities(data);
        setCitiesLoading(false);
      }
    };

    loadCities();

    return () => {
      cancelled = true;
    };
  }, [selectedRegion]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO 2.4 [Form Submit Bubble]: Trigger the structural context parent callback routine 'onSearch' 
    // passing through your active 'selectedCityName' value string.
    // [Your code here]

    onSearch(selectedCityName);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-start' }}>

        <FormControl fullWidth>
          <InputLabel id="region-label">Select Region</InputLabel>
          {/* TODO 2.5 [Controlled Parent Select]: Bind the Select component value to your region state.
              Implement an onChange handler to update your 'selectedRegion' with 'e.target.value'. */}
          <Select
            labelId="region-label"
            label="Select Region"
            // [Your props here]
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <Public color="primary" />
              </InputAdornment>
            }
            MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
          >
            {/* TODO 2.6 [Region Menu Map]: Dynamically map through your local regions array state layer 
                to output item choice options. Use region.code as the structural value and region.name for text displays. */}
            {/* [Your code here] */}

            {regions.map((region) => (
              <MenuItem key={region.code} value={region.code}>
                {region.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={!selectedRegion || citiesLoading}>
          <InputLabel id="city-label">Select City / Municipality</InputLabel>
          {/* TODO 2.7 [Controlled Child Select]: Bind the Select value to your city state property layout tracker.
              Capture 'e.target.value' into 'selectedCityName' inside your execution handler block. */}
          <Select
            labelId="city-label"
            label="Select City / Municipality"
            // [Your props here]
            value={selectedCityName}
            onChange={(e) => setSelectedCityName(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <LocationCity color={selectedRegion ? 'primary' : 'disabled'} />
              </InputAdornment>
            }
            MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
          >
            {/* TODO 2.8 [City Menu Map]: Map through your internal cities array state dynamically.
                Use city.code/id for selection key tracking and map city.name directly for option layout configurations. */}
            {/* [Your code here] */}

            {cities.map((city) => (
              <MenuItem key={city.code || city.id} value={city.name}>
                {city.name}
              </MenuItem>
            ))}
          </Select>
          {citiesLoading && <FormHelperText>Loading cities…</FormHelperText>}
        </FormControl>

        <Button
          type="submit"
          variant="contained"
          size="large"
          startIcon={<Search />}
          disabled={!selectedCityName}
          sx={{ px: 4, height: 56, minWidth: { md: 160 }, boxShadow: 3 }}
        >
          Search
        </Button>
      </Stack>
    </Box>
  );
}