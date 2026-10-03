import React, { useEffect, useState } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Button, Stack, InputAdornment, FormHelperText, ListSubheader, TextField, } from '@mui/material';
import { Search, Public, LocationCity } from '@mui/icons-material';
import { getRegions, getCitiesMunicipalitiesByRegion } from '../services/geoPhotoService';

// ADDED: search filter used by the search bars inside the dropdowns.
// Names starting with the typed letters come first (ignoring a leading "City of" / "Municipality of"),
// followed by names that merely contain them. Empty input shows everything.
const filterByTyping = (options, query) => {
  const q = query.trim().toLowerCase();
  if (!q) return options;

  const starts = [];
  const contains = [];

  options.forEach((option) => {
    const name = option.name.toLowerCase();
    const core = name.replace(/^(island garden city of|city of|municipality of)\s+/, '');
    if (name.startsWith(q) || core.startsWith(q)) starts.push(option);
    else if (name.includes(q)) contains.push(option);
  });

  return [...starts, ...contains];
};

// ADDED: search box shown at the top of a dropdown menu
const MenuSearchBox = ({ value, onChange, placeholder }) => (
  <ListSubheader sx={{ bgcolor: 'background.paper', py: 1 }}>
    <TextField
      size="small"
      autoFocus
      fullWidth
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        // keep typing inside the box (otherwise the menu jumps to items by letter), but let Escape close the menu
        if (e.key !== 'Escape') e.stopPropagation();
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search fontSize="small" />
          </InputAdornment>
        ),
      }}
    />
  </ListSubheader>
);

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

  // ADDED: what the user typed in each dropdown's search bar
  const [regionQuery, setRegionQuery] = useState('');
  const [cityQuery, setCityQuery] = useState('');

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

  // ADDED: lists after applying the search bars. The currently selected item is always kept in the list
  // (hidden if it does not match the search) so the Select never loses its selected value while filtering.
  const filteredRegions = filterByTyping(regions, regionQuery);
  const filteredCities = filterByTyping(cities, cityQuery);

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
            onClose={() => setRegionQuery('')}
            startAdornment={
              <InputAdornment position="start">
                <Public color="primary" />
              </InputAdornment>
            }
            MenuProps={{ autoFocus: false, PaperProps: { sx: { maxHeight: 320 } } }}
          >
            {/* ADDED: search bar at the top of the region list */}
            <MenuSearchBox value={regionQuery} onChange={setRegionQuery} placeholder="Search region…" />

            {/* TODO 2.6 [Region Menu Map]: Dynamically map through your local regions array state layer 
                to output item choice options. Use region.code as the structural value and region.name for text displays. */}
            {/* [Your code here] */}

            {regions
              .filter((region) => filteredRegions.includes(region) || region.code === selectedRegion)
              .sort((a, b) => {
                // keep the best matches (starts-with first) in order
                const ai = filteredRegions.indexOf(a);
                const bi = filteredRegions.indexOf(b);
                return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
              })
              .map((region) => (
                <MenuItem
                  key={region.code}
                  value={region.code}
                  sx={filteredRegions.includes(region) ? undefined : { display: 'none' }}
                >
                  {region.name}
                </MenuItem>
              ))}

            {regionQuery && filteredRegions.length === 0 && (
              <MenuItem disabled>No matching region</MenuItem>
            )}
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
            onClose={() => setCityQuery('')}
            startAdornment={
              <InputAdornment position="start">
                <LocationCity color={selectedRegion ? 'primary' : 'disabled'} />
              </InputAdornment>
            }
            MenuProps={{ autoFocus: false, PaperProps: { sx: { maxHeight: 320 } } }}
          >
            {/* ADDED: search bar at the top of the city / municipality list */}
            <MenuSearchBox value={cityQuery} onChange={setCityQuery} placeholder="Search city / municipality…" />

            {/* TODO 2.8 [City Menu Map]: Map through your internal cities array state dynamically.
                Use city.code/id for selection key tracking and map city.name directly for option layout configurations. */}
            {/* [Your code here] */}

            {cities
              .filter((city) => filteredCities.includes(city) || city.name === selectedCityName)
              .sort((a, b) => {
                const ai = filteredCities.indexOf(a);
                const bi = filteredCities.indexOf(b);
                return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
              })
              .map((city) => (
                <MenuItem
                  key={city.code || city.id}
                  value={city.name}
                  sx={filteredCities.includes(city) ? undefined : { display: 'none' }}
                >
                  {city.name}
                </MenuItem>
              ))}

            {cityQuery && filteredCities.length === 0 && (
              <MenuItem disabled>No matching city / municipality</MenuItem>
            )}
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