import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, Menu, TextInput } from 'react-native-paper';
import {
  getCitiesMunicipalitiesByRegion,
  getRegions,
  type City,
  type Region,
} from '@/services/geoPhotoService';

type IslandFilter = 'all' | 'luzon' | 'visayas' | 'mindanao';

const ISLAND_OPTIONS: { value: IslandFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'luzon', label: 'Luzon' },
  { value: 'visayas', label: 'Visayas' },
  { value: 'mindanao', label: 'Mindanao' },
];

const plainName = (name: string) => name.replace(/^City of\s+/i, '').trim();
const byName = (a: string, b: string) => plainName(a).localeCompare(plainName(b), 'en', { sensitivity: 'base' });

const MAX_VISIBLE = 100; 

export default function LocationForm({ onSearch }: { onSearch: (cityName: string) => void }) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCityName, setSelectedCityName] = useState('');
  const [islandFilter, setIslandFilter] = useState<IslandFilter>('all');

  const [regionMenuVisible, setRegionMenuVisible] = useState(false);
  const [cityMenuVisible, setCityMenuVisible] = useState(false);
  const [regionQuery, setRegionQuery] = useState('');
  const [cityQuery, setCityQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getRegions();
        if (!cancelled) setRegions(data);
      } catch (error) {
        console.error('Failed to load regions:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setSelectedCityName(''); 
    setCityQuery('');
    if (!selectedRegion) {
      setCities([]);
      return;
    }
    (async () => {
      try {
        const data = await getCitiesMunicipalitiesByRegion(selectedRegion);
        if (!cancelled) setCities(data);
      } catch (error) {
        console.error('Failed to load cities:', error);
        if (!cancelled) setCities([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedRegion]);

  const visibleRegions = useMemo(() => {
    const q = regionQuery.trim().toLowerCase();
    return regions
      .filter((r) => islandFilter === 'all' || String(r.islandGroupCode).toLowerCase() === islandFilter)
      .filter(
        (r) =>
          !q || r.name.toLowerCase().includes(q) || (r.regionName ?? '').toLowerCase().includes(q),
      )
      .sort((a, b) => byName(a.name, b.name));
  }, [regions, islandFilter, regionQuery]);

  const sortedCities = useMemo(() => [...cities].sort((a, b) => byName(a.name, b.name)), [cities]);
  const visibleCities = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    return sortedCities.filter((c) => !q || plainName(c.name).toLowerCase().includes(q));
  }, [sortedCities, cityQuery]);

  const handleIslandFilter = (value: IslandFilter) => {
    setIslandFilter(value);
    if (selectedRegion && value !== 'all') {
      const current = regions.find((r) => r.code === selectedRegion);
      if (!current || String(current.islandGroupCode).toLowerCase() !== value) {
        setSelectedRegion('');
        setSelectedCityName('');
      }
    }
  };

  const handleSubmit = () => {
    if (selectedCityName) onSearch(selectedCityName);
  };

  const selectedRegionLabel = regions.find((r) => r.code === selectedRegion)?.name ?? 'Select Region';
  const selectedCityLabel = selectedCityName || 'Select City / Municipality';

  return (
    <View style={styles.form}>
      <View style={styles.filterRow}>
        {ISLAND_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            selected={islandFilter === opt.value}
            showSelectedCheck
            onPress={() => handleIslandFilter(opt.value)}
          >
            {opt.label}
          </Chip>
        ))}
      </View>

      <View style={styles.row}>
        {/* Region menu */}
        <View style={styles.field}>
          <Menu
            visible={regionMenuVisible}
            onDismiss={() => {
              setRegionMenuVisible(false);
              setRegionQuery('');
            }}
            keyboardShouldPersistTaps="handled"
            contentStyle={styles.menuContent}
            anchor={
              <Button
                mode="outlined"
                icon="earth"
                contentStyle={styles.buttonContent}
                style={styles.button}
                onPress={() => setRegionMenuVisible(true)}
              >
               {selectedRegionLabel} ▾
              </Button>
            }
          >
            <TextInput
              mode="outlined"
              dense
              placeholder="Search region..."
              value={regionQuery}
              onChangeText={setRegionQuery}
              left={<TextInput.Icon icon="magnify" />}
              style={styles.search}
            />
            {visibleRegions.map((region) => (
              <Menu.Item
                key={region.code}
                title={region.name}
                onPress={() => {
                  setSelectedRegion(region.code);
                  setRegionMenuVisible(false);
                  setRegionQuery('');
                }}
              />
            ))}
            {visibleRegions.length === 0 && <Menu.Item title="No region found" disabled />}
          </Menu>
        </View>

        {/* City / Municipality menu */}
        <View style={styles.field}>
          <Menu
            visible={cityMenuVisible}
            onDismiss={() => {
              setCityMenuVisible(false);
              setCityQuery('');
            }}
            keyboardShouldPersistTaps="handled"
            contentStyle={styles.menuContent}
            anchor={
              <Button
                mode="outlined"
                icon="city-variant-outline"
                disabled={!selectedRegion}
                contentStyle={styles.buttonContent}
                style={styles.button}
                onPress={() => setCityMenuVisible(true)}
              >
                {selectedCityLabel} ▾
              </Button>
            }
          >
            <TextInput
              mode="outlined"
              dense
              placeholder="Search city / municipality..."
              value={cityQuery}
              onChangeText={setCityQuery}
              left={<TextInput.Icon icon="magnify" />}
              style={styles.search}
            />
            {visibleCities.slice(0, MAX_VISIBLE).map((city) => (
              <Menu.Item
                key={city.code}
                title={city.name}
                onPress={() => {
                  setSelectedCityName(city.name);
                  setCityMenuVisible(false);
                  setCityQuery('');
                }}
              />
            ))}
            {visibleCities.length === 0 && <Menu.Item title="No city found" disabled />}
            {visibleCities.length > MAX_VISIBLE && (
              <Menu.Item title={`Type to narrow down (${visibleCities.length} results)`} disabled />
            )}
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
    borderRadius: 14,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  searchButton: {
    width: '100%',
    borderRadius: 14,
  },
  menuContent: {
    minWidth: 260,
  },
  search: {
    marginHorizontal: 12,
    marginVertical: 8,
  },
});