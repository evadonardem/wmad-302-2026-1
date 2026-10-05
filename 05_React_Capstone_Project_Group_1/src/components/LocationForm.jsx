import React, { useEffect, useState } from 'react';
import { Box, Autocomplete, TextField, Button, Stack } from '@mui/material';
import { Search } from '@mui/icons-material';
import { getRegions, getCitiesMunicipalitiesByRegion } from '../services/geoPhotoService';

export default function LocationForm({ onSearch }) {
  // TODO 2.1 [State Trackers]: Store regions, cities, selected region, and selected city.
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedCityName, setSelectedCityName] = useState('');

  useEffect(() => {
    // TODO 2.2 [Initial Data Populate]: Load all regions when the component starts.
    getRegions().then((data) => {
      setRegions(data);
    });
  }, []);

  useEffect(() => {
    // TODO 2.3 [Reactive Cascading Refresh]: Load cities based on the selected region.
    if (selectedRegion) {
      getCitiesMunicipalitiesByRegion(selectedRegion.code).then((data) => {
        setCities(data);
      });
    } else {
      setCities([]);
    }

    // Reset the city when the region changes.
    setSelectedCityName('');
  }, [selectedRegion]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // TODO 2.4 [Form Submit Bubble]: Send the selected city to the parent component.
    onSearch(selectedCityName);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mb: 4 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="center"
      >

        {/* TODO 2.5 [Controlled Parent Select]: Connect the region autocomplete to its state. */}
        <Autocomplete
          fullWidth
          options={[...regions].sort((a, b) =>
            a.name.localeCompare(b.name)
          )}
          value={selectedRegion}
          onChange={(e, newValue) => {
            setSelectedRegion(newValue);
          }}
          getOptionLabel={(option) => option.name || ''}
          isOptionEqualToValue={(option, value) =>
            option.code === value.code
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Region"
              size="small"
              InputLabelProps={{
                ...params.InputLabelProps,
                shrink: false,
              }}
              sx={{
                '& .MuiInputLabel-root': {
                  color: '#000000',
                },

                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#000000',
                },

                '& .MuiOutlinedInput-input': {
                  color: '#000000',
                },
              }}
            />
          )}
        />

        {/* TODO 2.7 [Controlled Child Select]: Connect the city autocomplete to its state. */}
        <Autocomplete
          fullWidth
          disabled={!selectedRegion}
          options={[...cities].sort((a, b) =>
            a.name.localeCompare(b.name)
          )}
          value={
            cities.find((city) => city.name === selectedCityName) || null
          }
          onChange={(e, newValue) => {
            setSelectedCityName(newValue ? newValue.name : '');
          }}
          getOptionLabel={(option) => option.name || ''}
          isOptionEqualToValue={(option, value) =>
            option.code === value.code
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select City / Municipality"
              size="small"
              InputLabelProps={{
                ...params.InputLabelProps,
                shrink: false,
              }}
              sx={{
                '& .MuiInputLabel-root': {
                  color: '#000000',
                },

                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#000000',
                },

                '& .MuiOutlinedInput-input': {
                  color: '#000000',
                },
              }}
            />
          )}
        />

        <Button
          type="submit"
          variant="contained"
          startIcon={<Search />}
          disabled={!selectedCityName}
          sx={{
            textTransform: 'none',
            px: 4,
            minWidth: { sm: 120 },
          }}
        >
          Search
        </Button>

      </Stack>
    </Box>
  );
}