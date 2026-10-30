import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, Menu } from 'react-native-paper';
import {
  getCitiesMunicipalitiesByRegion,
  getRegions,
  type City,
  type Region,
} from '@/services/geoPhotoService';

type IslandFilter = 'all' | 'luzon' | 'visayas' | 'mindanao';

const ISLAND_FILTERS: { value: IslandFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'luzon', label: 'Luzon' },
  { value: 'visayas', label: 'Visayas' },
  { value: 'mindanao', label: 'Mindanao' },
];

export default function LocationForm({ onSearch }: { onSearch: (cityName: string) => void }) {
  // TODO 2.1 [State Trackers]: Replace the four placeholder trackers below with real React state hooks:
  // - 'regions': Stores the array of all regions (default: empty array)
  // - 'cities': Stores the array of filtered sub-municipalities (default: empty array)
  // - 'selectedRegion': String tracking the chosen active region code (default: empty string)
  // - 'selectedCityName': String tracking the chosen city text name fed to the search keyword engine (default: empty string)
  const [regions, setRegions] = useState<Region[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCityName, setSelectedCityName] = useState('');

  // Paper <Menu> visibility flags (scaffolded UI chrome — no TODO required)
  const [regionMenuVisible, setRegionMenuVisible] = useState(false);
  const [cityMenuVisible, setCityMenuVisible] = useState(false);

  // TODO 2.9 (a): island-group filter state
  const [islandFilter, setIslandFilter] = useState<IslandFilter>('all');

  useEffect(() => {
    // TODO 2.2 [Initial Data Populate]: Invoke the 'getRegions' service function asynchronously inside
    // this mounting side-effect and store the returned collection into your local regions state.
    let cancelled = false;

    const loadRegions = async () => {
      const data = await getRegions();
      if (!cancelled) {
        setRegions(data);
      }
    };

    loadRegions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // TODO 2.3 [Reactive Cascading Refresh]: Run whenever 'selectedRegion' changes.
    // a. If selectedRegion holds a valid code, call 'getCitiesMunicipalitiesByRegion(selectedRegion)'
    //    and load the result into your cities list state.
    // b. CRITICAL: Reset your 'selectedCityName' state back to an empty string so stale child
    //    selections never leak into the next search.

    // b. Always clear the stale child selection (and the old list) first.
    setSelectedCityName('');
    setCities([]);

    if (!selectedRegion) {
      return;
    }

    // `cancelled` guards against race conditions: if the user switches regions quickly,
    // a slow response from the previous region is ignored.
    let cancelled = false;

    const loadCities = async () => {
      const data = await getCitiesMunicipalitiesByRegion(selectedRegion);
      if (!cancelled) {
        setCities(data);
      }
    };

    loadCities();

    return () => {
      cancelled = true;
    };
  }, [selectedRegion]);

  const handleSubmit = () => {
    // TODO 2.4 [Form Submit Bubble]: Trigger the parent callback routine 'onSearch'
    // passing through your active 'selectedCityName' value string.
    if (selectedCityName) {
      onSearch(selectedCityName);
    }
  };

  // TODO 2.9 (b): filtered region list derived from 'regions' + 'islandFilter'
  const filteredRegions = useMemo(
    () =>
      islandFilter === 'all'
        ? regions
        : regions.filter((r) => r.islandGroupCode === islandFilter),
    [regions, islandFilter],
  );

  const handleFilterChange = (next: IslandFilter) => {
    setIslandFilter(next);

    // TODO 2.9 (d) SAFETY: if the selected region falls outside the new filter, reset selections.
    if (selectedRegion && next !== 'all') {
      const current = regions.find((r) => r.code === selectedRegion);
      if (!current || current.islandGroupCode !== next) {
        setSelectedRegion('');
        setSelectedCityName('');
      }
    }
  };

  // Display labels derived from the current selections (scaffolded)
  const selectedRegionLabel = regions.find((r) => r.code === selectedRegion)?.name ?? 'Select Region';
  const selectedCityLabel = selectedCityName || 'Select City / Municipality';

  return (
    <View style={styles.form}>
      {/* TODO 2.9 [Island-Group Filter]: Let users narrow the region menu by island group:
          a. Add state 'islandFilter' (default 'all'; option values 'all' | 'luzon' | 'visayas' |
             'mindanao', matching the Region.islandGroupCode field).
          b. Derive a filtered region list (useMemo) from 'regions' + 'islandFilter', and have your
             TODO 2.6 menu map over THAT list instead of the raw array.
          c. Render a row of Paper <Chip> options in the filterRow below (selected chip highlighted,
             onPress sets the filter).
          d. SAFETY: if the currently selected region falls outside the new filter, reset
             'selectedRegion' and 'selectedCityName' so a hidden selection can never trigger a search. */}
      <View style={styles.filterRow}>
        {ISLAND_FILTERS.map((option) => (
          <Chip
            key={option.value}
            selected={islandFilter === option.value}
            showSelectedOverlay
            onPress={() => handleFilterChange(option.value)}
          >
            {option.label}
          </Chip>
        ))}
      </View>

      <View style={styles.row}>
        <View style={styles.field}>
          <Menu
            visible={regionMenuVisible}
            onDismiss={() => setRegionMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                icon="menu-down"
                contentStyle={styles.buttonContent}
                style={styles.button}
                onPress={() => setRegionMenuVisible(true)}
              >
                {selectedRegionLabel}
              </Button>
            }
          >
            {/* TODO 2.6 [Region Menu Map]: Dynamically map through your local regions array state to
                output <Menu.Item> choice options. Use region.code as the selection value and
                region.name for the displayed label. Each item's onPress should write the code into
                'selectedRegion' and dismiss the menu (setRegionMenuVisible(false)). */}
            {filteredRegions.map((region) => (
              <Menu.Item
                key={region.code}
                title={region.name}
                onPress={() => {
                  setSelectedRegion(region.code);
                  setRegionMenuVisible(false);
                }}
              />
            ))}
          </Menu>
        </View>

        <View style={styles.field}>
          <Menu
            visible={cityMenuVisible}
            onDismiss={() => setCityMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                icon="menu-down"
                disabled={!selectedRegion}
                contentStyle={styles.buttonContent}
                style={styles.button}
                onPress={() => setCityMenuVisible(true)}
              >
                {selectedCityLabel}
              </Button>
            }
          >
            {/* TODO 2.8 [City Menu Map]: Map through your internal cities array state to output
                <Menu.Item> options. Use city.code as the selection key and map city.name to the
                label. Each item's onPress should write the name into 'selectedCityName'
                and dismiss the menu. */}
            {cities.map((city) => (
              <Menu.Item
                key={city.code}
                title={city.name}
                onPress={() => {
                  setSelectedCityName(city.name);
                  setCityMenuVisible(false);
                }}
              />
            ))}
          </Menu>
        </View>

        <Button
          mode="contained"
          icon="magnify"
          disabled={!selectedCityName}
          contentStyle={styles.buttonContent}
          style={styles.searchButton}
          onPress={handleSubmit}
        >
          Search
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    width: '100%',
    marginBottom: 24,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'column',
    gap: 12,
    alignItems: 'stretch',
  },
  field: {
    width: '100%',
  },
  button: {
    width: '100%',
  },
  buttonContent: {
    paddingVertical: 6,
  },
  searchButton: {
    width: '100%',
  },
});