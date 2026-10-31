import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Text, useTheme } from 'react-native-paper';
import { usePalette } from '@/themeMode';

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

// Reusable popup list (replaces Paper <Menu>, which fails inside ScrollView on web)
function PickerModal({
  visible,
  title,
  items,
  emptyText,
  onSelect,

  onClose,
}: {
  visible: boolean;
  title: string;
  items: { key: string; label: string }[];
  emptyText: string;
  onSelect: (key: string) => void;
  onClose: () => void;
}) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
          <Text variant="titleMedium" style={[styles.sheetTitle, { color: theme.colors.onSurface }]}>
            {title}
          </Text>
          <ScrollView>
            {items.length === 0 ? (
              <Text style={[styles.empty, { color: theme.colors.onSurfaceVariant }]}>{emptyText}</Text>
            ) : (
              items.map((item) => (
                <Pressable
                  key={item.key}
                  onPress={() => onSelect(item.key)}
                  style={({ pressed }) => [
                    styles.item,
                    pressed && { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <Text style={{ color: theme.colors.onSurface }}>{item.label}</Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function LocationForm({ onSearch }: { onSearch: (cityName: string) => void }) {
  // TODO 2.1 [State Trackers]
  const [regions, setRegions] = useState<Region[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCityName, setSelectedCityName] = useState('');

  // TODO 2.9 (a)
  const [islandFilter, setIslandFilter] = useState<IslandFilter>('all');

  const [regionMenuVisible, setRegionMenuVisible] = useState(false);
  const [cityMenuVisible, setCityMenuVisible] = useState(false);

  useEffect(() => {
    // TODO 2.2 [Initial Data Populate]
    let cancelled = false;
    (async () => {
      const result = await getRegions();
      if (!cancelled) setRegions(result ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // TODO 2.3 [Reactive Cascading Refresh]
    setSelectedCityName('');
    setCities([]);

    if (!selectedRegion) return;

    let cancelled = false;
    (async () => {
      const result = await getCitiesMunicipalitiesByRegion(selectedRegion);
      if (!cancelled) setCities(result ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedRegion]);

  // TODO 2.9 (b)
  const filteredRegions = useMemo(
    () =>
      islandFilter === 'all'
        ? regions
        : regions.filter((r) => r.islandGroupCode === islandFilter),
    [regions, islandFilter],
  );

  const handleFilterChange = (value: IslandFilter) => {
    setIslandFilter(value);

    // TODO 2.9 (d) SAFETY
    if (selectedRegion && value !== 'all') {
      const stillVisible = regions.some(
        (r) => r.code === selectedRegion && r.islandGroupCode === value,
      );
      if (!stillVisible) {
        setSelectedRegion('');
        setSelectedCityName('');
      }
    }
  };

  const handleSubmit = () => {
    // TODO 2.4 [Form Submit Bubble]
    if (selectedCityName) {
      onSearch(selectedCityName);
    }
  };

  const selectedRegionLabel = regions.find((r) => r.code === selectedRegion)?.name ?? 'Select Region';
  const selectedCityLabel = selectedCityName || 'Select City / Municipality';

  return (
    <View style={styles.form}>
      {/* TODO 2.9 (c) [Island-Group Filter] */}
      <View style={styles.filterRow}>
        {ISLAND_OPTIONS.map((option) => (
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
          <Button
            mode="outlined"
            icon="menu-down"
            contentStyle={styles.buttonContent}
            style={styles.button}
            onPress={() => setRegionMenuVisible(true)}
          >
            {selectedRegionLabel}
          </Button>
          {/* TODO 2.6 [Region Menu Map] */}
          <PickerModal
            visible={regionMenuVisible}
            title="Select Region"
            items={filteredRegions.map((r) => ({ key: r.code, label: r.name }))}
            emptyText={
              regions.length === 0
                ? 'No regions loaded. Check your internet connection and try again.'
                : 'No regions in this island group.'
            }
            onSelect={(code) => {
              setSelectedRegion(code);
              setRegionMenuVisible(false);
            }}
            onClose={() => setRegionMenuVisible(false)}
          />
        </View>

        <View style={styles.field}>
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
          {/* TODO 2.8 [City Menu Map] */}
          <PickerModal
            visible={cityMenuVisible}
            title="Select City / Municipality"
            items={cities.map((c) => ({ key: c.code, label: c.name }))}
            emptyText="Loading cities..."
            onSelect={(code) => {
              const city = cities.find((c) => c.code === code);
              if (city) setSelectedCityName(city.name);
              setCityMenuVisible(false);
            }}
            onClose={() => setCityMenuVisible(false)}
          />
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    maxHeight: 420,
    borderRadius: 16,
    padding: 12,
  },
  sheetTitle: {
    fontWeight: '700',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: 24,
  },
});