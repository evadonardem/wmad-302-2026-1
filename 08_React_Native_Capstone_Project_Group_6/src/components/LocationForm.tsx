import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Button, Chip, Menu, Text, useTheme } from 'react-native-paper';
import {
  getCitiesMunicipalitiesByRegion,
  getRegions,
  type City,
  type Region,
} from '@/services/geoPhotoService';

type IslandFilter = 'all' | 'luzon' | 'visayas' | 'mindanao';

const SEARCH_PURPLE = '#6750a4';

const ISLAND_OPTIONS: { value: IslandFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'luzon', label: 'Luzon' },
  { value: 'visayas', label: 'Visayas' },
  { value: 'mindanao', label: 'Mindanao' },
];

export default function LocationForm({ onSearch }: { onSearch: (cityName: string) => void }) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const horizontalLayout = width >= 640;
  const darkMode = theme.dark;

  // TODO 2.1 [State Trackers]
  const [regions, setRegions] = useState<Region[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCityName, setSelectedCityName] = useState('');
  const [regionsError, setRegionsError] = useState('');
  const [citiesError, setCitiesError] = useState('');
  const [regionsRetry, setRegionsRetry] = useState(0);
  const [citiesRetry, setCitiesRetry] = useState(0);
  const [selectionMessage, setSelectionMessage] = useState('');

  // TODO 2.9 (a): island-group filter state
  const [islandFilter, setIslandFilter] = useState<IslandFilter>('all');

  // Paper <Menu> visibility flags (scaffolded UI chrome)
  const [regionMenuVisible, setRegionMenuVisible] = useState(false);
  const [cityMenuVisible, setCityMenuVisible] = useState(false);

  // TODO 2.2 [Initial Data Populate]
  useEffect(() => {
    let ignore = false;
    getRegions().then((data) => {
      if (!ignore) {
        setRegions(data);
        setRegionsError('');
      }
    }).catch((error: unknown) => {
      if (!ignore) {
        setRegionsError(
          error instanceof Error ? error.message : 'Unable to load regions. Check your connection.',
        );
      }
    });
    return () => {
      ignore = true;
    };
  }, [regionsRetry]);

  // TODO 2.3 [Reactive Cascading Refresh]
  useEffect(() => {
    let ignore = false; // drops stale responses when the region changes quickly
    if (selectedRegion) {
      getCitiesMunicipalitiesByRegion(selectedRegion).then((data) => {
        if (!ignore) {
          setCities([...data].sort((a, b) => a.name.localeCompare(b.name)));
          setCitiesError('');
        }
      }).catch((error: unknown) => {
        if (!ignore) {
          setCitiesError(
            error instanceof Error ? error.message : 'Unable to load cities. Check your connection.',
          );
        }
      });
    }
    return () => {
      ignore = true;
    };
  }, [selectedRegion, citiesRetry]);

  // TODO 2.9 (b): derived, filtered region list
  const filteredRegions = useMemo(
    () =>
      islandFilter === 'all'
        ? regions
        : regions.filter((r) => r.islandGroupCode === islandFilter),
    [regions, islandFilter],
  );

  // TODO 2.9 (c, d): change filter + reset any selection that falls outside it
  const handleFilterPress = (value: IslandFilter) => {
    setIslandFilter(value);
    if (selectedRegion) {
      const stillVisible =
        value === 'all' ||
        regions.find((r) => r.code === selectedRegion)?.islandGroupCode === value;
      if (!stillVisible) {
        setSelectedRegion('');
        setSelectedCityName('');
        setCities([]);
        setCitiesError('');
      }
    }
  };

  // TODO 2.4 [Form Submit Bubble] (no event object in React Native)
  const handleSubmit = () => {
    if (!selectedRegion) {
      setSelectionMessage('Choose a region first.');
      return;
    }
    if (!selectedCityName) {
      setSelectionMessage('Choose a city or municipality to search.');
      return;
    }
    setSelectionMessage('');
    onSearch(selectedCityName);
  };

  const handleRegionSelect = (code: string) => {
    setSelectionMessage('');
    if (code !== selectedRegion) {
      setSelectedCityName('');
      setCities([]);
      setCitiesError('');
    }
    setSelectedRegion(code);
    setRegionMenuVisible(false);
  };

  // Display labels derived from the current selections (scaffolded)
  const selectedRegionLabel = regions.find((r) => r.code === selectedRegion)?.name ?? 'Select Region';
  const selectedCityLabel = selectedCityName || 'Select City / Municipality';

  return (
    <View
      style={[
        styles.form,
        {
          backgroundColor: darkMode
            ? 'rgba(0, 0, 0, 0.94)'
            : 'rgba(255, 255, 255, 0.94)',
        },
      ]}
    >
      {/* TODO 2.9 (c): Island-group chips */}
      <View style={styles.filterRow}>
        {ISLAND_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            selected={islandFilter === opt.value}
            showSelectedOverlay
            style={[styles.chip, islandFilter === opt.value ? styles.chipSelected : styles.chipUnselected]}
            textStyle={[
              styles.chipText,
              { color: islandFilter === opt.value ? '#fff' : theme.colors.onSurface },
            ]}
            onPress={() => handleFilterPress(opt.value)}
          >
            {opt.label}
          </Chip>
        ))}
      </View>

      {regionsError ? (
        <View style={styles.errorRow}>
          <Text style={styles.errorText}>Could not load regions: {regionsError}</Text>
          <Button
            compact
            onPress={() => {
              setRegionsError('');
              setRegionsRetry((retry) => retry + 1);
            }}
          >
            Retry
          </Button>
        </View>
      ) : null}

      <View style={[styles.row, !horizontalLayout && styles.rowCompact]}>
        <View style={[styles.field, horizontalLayout && styles.fieldWide]}>
          <Menu
            visible={regionMenuVisible}
            onDismiss={() => setRegionMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                icon="menu-down"
                contentStyle={styles.buttonContent}
                style={styles.button}
                textColor={theme.colors.onSurface}
                onPress={() => setRegionMenuVisible(true)}
              >
                {selectedRegionLabel}
              </Button>
            }
          >
            {/* TODO 2.6 [Region Menu Map] - maps the FILTERED list (2.9b) */}
            <ScrollView style={styles.menuScroll}>
              {filteredRegions.map((region) => (
                <Menu.Item
                  key={region.code}
                  title={region.name}
                  onPress={() => handleRegionSelect(region.code)}
                />
              ))}
            </ScrollView>
          </Menu>
        </View>

        <View style={[styles.field, horizontalLayout && styles.fieldWide]}>
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
                textColor={theme.colors.onSurface}
                onPress={() => setCityMenuVisible(true)}
              >
                {selectedCityLabel}
              </Button>
            }
          >
            {/* TODO 2.8 [City Menu Map] */}
            <ScrollView style={styles.menuScroll}>
              {cities.map((city) => (
                <Menu.Item
                  key={city.code}
                  title={city.name}
                  onPress={() => {
                    setSelectedCityName(city.name);
                    setSelectionMessage('');
                    setCityMenuVisible(false);
                  }}
                />
              ))}
            </ScrollView>
          </Menu>
        </View>

        <Button
          mode="contained"
          icon="magnify"
          contentStyle={styles.buttonContent}
          style={[styles.searchButton, horizontalLayout && styles.searchButtonWide]}
          buttonColor={darkMode ? 'rgba(255,255,255,0.15)' : theme.colors.primary}
          textColor={darkMode ? '#fff' : theme.colors.onPrimary}
          onPress={handleSubmit}
        >
          Search
        </Button>
      </View>
      {selectionMessage ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.selectionMessage, { color: theme.colors.error }]}
        >
          {selectionMessage}
        </Text>
      ) : null}
      {citiesError ? (
        <View style={styles.errorRow}>
          <Text style={styles.errorText}>Could not load cities: {citiesError}</Text>
          <Button
            compact
            onPress={() => {
              setCitiesError('');
              setCitiesRetry((retry) => retry + 1);
            }}
          >
            Retry
          </Button>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    width: '100%',
    marginBottom: 20,
    padding: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(11, 28, 40, 0.9)',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
    justifyContent: 'flex-start',
  },
  chip: { height: 30, borderRadius: 6 },
  chipSelected: { backgroundColor: SEARCH_PURPLE },
  chipUnselected: { backgroundColor: 'rgba(127,127,127,0.16)' },
  chipText: { fontSize: 12, lineHeight: 16 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  rowCompact: { flexDirection: 'column', alignItems: 'stretch', gap: 10 },
  field: { width: '100%' },
  fieldWide: { flex: 1, minWidth: 0 },
  button: { width: '100%', borderRadius: 2 },
  buttonContent: { minHeight: 40, paddingVertical: 2 },
  searchButton: { width: '100%', borderRadius: 2 },
  searchButtonWide: { width: 112, minWidth: 112 },
  menuScroll: { maxHeight: 300 },
  errorRow: { alignItems: 'center', marginBottom: 8 },
  errorText: { textAlign: 'center' },
  selectionMessage: { textAlign: 'center', marginTop: 8 },
});
