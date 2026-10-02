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
  // [Your code here]

  useEffect(() => {
    // TODO 2.2 [Initial Data Populate]: Invoke the 'getRegions' service function asynchronously inside a mounting side-effect.
    // Set the returned collection smoothly into your local regions state layer.
    // [Your code here]
  }, []);

  useEffect(() => {
    // TODO 2.3 [Reactive Cascading Refresh]: Trigger an asynchronous refresh whenever 'selectedRegion' changes.
    // If selectedRegion is a valid code, call 'getCitiesMunicipalitiesByRegion(selectedRegion)' and load the cities list state.
    // CRITICAL: Reset your 'selectedCityName' tracking states back to an empty string to keep inputs contextually clean!
    // [Your code here]
  }, [selectedRegion]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO 2.4 [Form Submit Bubble]: Trigger the structural context parent callback routine 'onSearch' 
    // passing through your active 'selectedCityName' value string.
    // [Your code here]
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mb: 4 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
        
        <FormControl fullWidth size="small">
          <InputLabel id="region-label">Select Region</InputLabel>
          {/* TODO 2.5 [Controlled Parent Select]: Bind the Select component value to your region state.
              Implement an onChange handler to update your 'selectedRegion' with 'e.target.value'. */}
          <Select
            labelId="region-label"
            label="Select Region"
            // [Your props here]
          >
            {/* TODO 2.6 [Region Menu Map]: Dynamically map through your local regions array state layer 
                to output item choice options. Use region.code as the structural value and region.name for text displays. */}
            {/* [Your code here] */}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small" disabled={!selectedRegion}>
          <InputLabel id="city-label">Select City / Municipality</InputLabel>
          {/* TODO 2.7 [Controlled Child Select]: Bind the Select value to your city state property layout tracker.
              Capture 'e.target.value' into 'selectedCityName' inside your execution handler block. */}
          <Select
            labelId="city-label"
            label="Select City / Municipality"
            // [Your props here]
          >
            {/* TODO 2.8 [City Menu Map]: Map through your internal cities array state dynamically.
                Use city.code/id for selection key tracking and map city.name directly for option layout configurations. */}
            {/* [Your code here] */}
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