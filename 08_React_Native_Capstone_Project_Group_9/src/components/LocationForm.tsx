import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import {
  getCitiesMunicipalitiesByRegion,
  getRegions,
  type City,
  type Region,
} from '@/services/geoPhotoService';
import { usePalette } from '@/themeMode';

type IslandFilter = 'all' | 'luzon' | 'visayas' | 'mindanao';

const ISLAND_OPTIONS: { value: IslandFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'luzon', label: 'Luzon' },
  { value: 'visayas', label: 'Visayas' },
  { value: 'mindanao', label: 'Mindanao' },
];

// Popup list with a type-to-search box (replaces Paper <Menu>, which fails inside ScrollView on web)
function PickerModal({
  visible,
  title,
  items,
  selectedKey,
  emptyText,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  items: { key: string; label: string }[];
  selectedKey?: string;
  emptyText: string;
  onSelect: (key: string) => void;
  onClose: () => void;
}) {
  const p = usePalette();
  const [query, setQuery] = useState('');

  // Start with an empty search every time the popup opens
  useEffect(() => {
    if (visible) setQuery('');
  }, [visible]);

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((item) => item.label.toLowerCase().includes(q)) : items;
  }, [items, query]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: p.card }]}>
          <Text style={[styles.sheetTitle, { color: p.textSoft }]}>{title}</Text>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Type to search..."
            placeholderTextColor={p.textSoft}
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={() => {
              // Enter picks the first match
              if (visibleItems.length > 0) onSelect(visibleItems[0].key);
            }}
            style={[
              styles.searchInput,
              { borderColor: p.border, backgroundColor: p.field, color: p.text },
            ]}
          />

          <ScrollView keyboardShouldPersistTaps="handled">
            {items.length === 0 ? (
              <Text style={[styles.empty, { color: p.textSoft }]}>{emptyText}</Text>
            ) : visibleItems.length === 0 ? (
              <Text style={[styles.empty, { color: p.textSoft }]}>
                No matches for "{query.trim()}".
              </Text>
            ) : (
              visibleItems.map((item) => {
                const active = item.key === selectedKey;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => onSelect(item.key)}
                    style={({ pressed }) => [
                      styles.item,
                      (active || pressed) && { backgroundColor: p.field },
                    ]}
                  >
                    <Text style={{ color: p.text, fontWeight: active ? '700' : '400' }}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Outlined field with a small floating label, like a text field
function PickerField({
  label,
  value,
  disabled,
  onPress,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  const p = usePalette();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.fieldBox, { borderColor: p.border, opacity: disabled ? 0.5 : 1 }]}
    >
      <Text style={[styles.fieldLabel, { color: p.textSoft, backgroundColor: p.card }]}>
        {label}
      </Text>
      <Text numberOfLines={1} style={[styles.fieldValue, { color: value ? p.text : p.textSoft }]}>
        {value || 'Select'}
      </Text>
      <Ionicons name="caret-down" size={12} color={p.textSoft} style={styles.caret} />
    </Pressable>
  );
}

export default function LocationForm({ onSearch }: { onSearch: (cityName: string) => void }) {
  const p = usePalette();

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

  const selectedRegionName = regions.find((r) => r.code === selectedRegion)?.name ?? '';
  const selectedCityCode = cities.find((c) => c.name === selectedCityName)?.code;

  return (
    <View style={styles.wrapper}>
      {/* TODO 2.9 (c) [Island-Group Filter] */}
      <View style={styles.filterRow}>
        {ISLAND_OPTIONS.map((option) => {
          const active = islandFilter === option.value;
          return (
            <Chip
              key={option.value}
              compact
              selected={active}
              showSelectedOverlay={false}
              style={{ backgroundColor: active ? p.accent : 'rgba(0,0,0,0.35)' }}
              textStyle={{ color: '#ffffff' }}
              selectedColor="#ffffff"
              onPress={() => handleFilterChange(option.value)}
            >
              {option.label}
            </Chip>
          );
        })}
      </View>

      <View style={[styles.panel, { backgroundColor: p.card }]}>
        <View style={styles.field}>
          <PickerField
            label="Select Region"
            value={selectedRegionName}
            onPress={() => setRegionMenuVisible(true)}
          />
          {/* TODO 2.6 [Region Menu Map] */}
          <PickerModal
            visible={regionMenuVisible}
            title="Select Region"
            items={filteredRegions.map((r) => ({ key: r.code, label: r.name }))}
            selectedKey={selectedRegion}
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
          <PickerField
            label="Select City / Municipality"
            value={selectedCityName}
            disabled={!selectedRegion}
            onPress={() => setCityMenuVisible(true)}
          />
          {/* TODO 2.8 [City Menu Map] */}
          <PickerModal
            visible={cityMenuVisible}
            title="Select City / Municipality"
            items={cities.map((c) => ({ key: c.code, label: c.name }))}
            selectedKey={selectedCityCode}
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
          buttonColor={p.accent}
          textColor="#ffffff"
          disabled={!selectedCityName}
          contentStyle={styles.searchContent}
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
  wrapper: {
    width: '100%',
    maxWidth: 900,
    alignItems: 'center',
    gap: 14,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  panel: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 40,
  },
  field: {
    flexGrow: 1,
    flexBasis: 220,
  },
  fieldBox: {
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  fieldLabel: {
    position: 'absolute',
    top: -9,
    left: 12,
    paddingHorizontal: 4,
    fontSize: 11,
  },
  fieldValue: {
    textAlign: 'center',
    paddingRight: 16,
    fontSize: 15,
  },
  caret: {
    position: 'absolute',
    right: 14,
  },
  searchButton: {
    flexGrow: 1,
    flexBasis: 140,
    borderRadius: 24,
  },
  searchContent: {
    height: 48,
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
    maxHeight: 460,
    borderRadius: 20,
    padding: 12,
  },
  sheetTitle: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    fontSize: 15,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: 24,
  },
});