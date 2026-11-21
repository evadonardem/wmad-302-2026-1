import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Button, Chip, Menu, Searchbar, Text, useTheme } from 'react-native-paper';
import { getCitiesMunicipalitiesByRegion, getRegions, type City, type Region, type SearchOptions, } from '@/services/geoPhotoService';

type IslandFilter = 'all' | 'luzon' | 'visayas' | 'mindanao';

const ISLAND_FILTERS: { value: IslandFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'luzon', label: 'Luzon' },
  { value: 'visayas', label: 'Visayas' },
  { value: 'mindanao', label: 'Mindanao' },
];

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

const sortKey = (name: string) => name.replace(/^city of\s+/i, '');

const byName = (a: { name: string }, b: { name: string }) =>
  sortKey(a.name).localeCompare(sortKey(b.name), undefined, {
    sensitivity: 'base',
    numeric: true,
  });

const MENU_LIST_MAX_HEIGHT = 280;

export default function LocationForm({
  onSearch,
}: {
  // Third argument: extra details (region code, and 'wholeRegion' when no city was picked)
  onSearch: (cityName: string, regionName?: string, options?: SearchOptions) => void;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  // On wide screens the two menus and the Search button sit on one row
  const isWide = width >= 760;

  const [regions, setRegions] = useState<Region[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCityName, setSelectedCityName] = useState('');

  // Paper <Menu> visibility flags (scaffolded UI chrome — no TODO required)
  const [regionMenuVisible, setRegionMenuVisible] = useState(false);
  const [cityMenuVisible, setCityMenuVisible] = useState(false);

  // Text typed into each menu's search box
  const [regionQuery, setRegionQuery] = useState('');
  const [cityQuery, setCityQuery] = useState('');

  const [islandFilter, setIslandFilter] = useState<IslandFilter>('all');

  useEffect(() => {
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
    setSelectedCityName('');
    setCities([]);
    setCityQuery('');

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
    // The region's name travels along so the photo check can also confirm the region
    const region = regions.find((r) => r.code === selectedRegion);
    const regionName = region?.regionName || region?.name;

    if (selectedCityName) {
      onSearch(selectedCityName, regionName, { regionCode: selectedRegion });
    } else if (selectedRegion && regionName) {
      // No city picked: search the whole region and its different municipalities
      onSearch(regionName, regionName, { regionCode: selectedRegion, wholeRegion: true });
    }
  };

  const filteredRegions = useMemo(() => {
    const byIsland =
      islandFilter === 'all'
        ? regions
        : regions.filter((r) => r.islandGroupCode === islandFilter);

    const q = normalize(regionQuery);
    const matched = q
      ? byIsland.filter((r) => normalize(r.name).includes(q))
      : byIsland;

    return [...matched].sort(byName);
  }, [regions, islandFilter, regionQuery]);

  const filteredCities = useMemo(() => {
    const q = normalize(cityQuery);
    const matched = q
      ? cities.filter((c) => normalize(c.name).includes(q))
      : cities;

    return [...matched].sort(byName);
  }, [cities, cityQuery]);

  const handleFilterChange = (next: IslandFilter) => {
    setIslandFilter(next);

    if (selectedRegion && next !== 'all') {
      const current = regions.find((r) => r.code === selectedRegion);
      if (!current || current.islandGroupCode !== next) {
        setSelectedRegion('');
        setSelectedCityName('');
      }
    }
  };

  const closeRegionMenu = () => {
    setRegionMenuVisible(false);
    setRegionQuery('');
  };

  const closeCityMenu = () => {
    setCityMenuVisible(false);
    setCityQuery('');
  };

  // Display labels derived from the current selections (scaffolded)
  const selectedRegionLabel = regions.find((r) => r.code === selectedRegion)?.name ?? 'Select Region';
  const selectedCityLabel =
    selectedCityName || (selectedRegion ? 'All cities / municipalities' : 'Select City / Municipality');
  const selectedRegionObject = regions.find((r) => r.code === selectedRegion);
  const selectedRegionDisplay = selectedRegionObject?.regionName || selectedRegionObject?.name;

  // Rounded outlined look shared by both menu buttons
  const menuButtonStyle = [
    styles.button,
    { borderColor: theme.colors.outline, backgroundColor: theme.colors.primaryContainer + '55' },
  ];

  return (
    <View style={styles.form}>
      <Text variant="labelMedium" style={[styles.filterLabel, { color: theme.colors.onSurfaceVariant }]}>
        Browse by island group
      </Text>
      <View style={styles.filterRow}>
        {ISLAND_FILTERS.map((option) => {
          const active = islandFilter === option.value;
          return (
            <Chip
              key={option.value}
              selected={active}
              showSelectedOverlay
              onPress={() => handleFilterChange(option.value)}
              selectedColor={active ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
              style={[
                styles.chip,
                { backgroundColor: active ? theme.colors.primary : theme.colors.surfaceVariant },
              ]}
              textStyle={{ fontWeight: '700', color: active ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }}
            >
              {option.label}
            </Chip>
          );
        })}
      </View>

      <View style={[styles.row, isWide && styles.rowWide]}>
        <View style={[styles.field, isWide && styles.fieldWide]}>
          <Menu
            visible={regionMenuVisible}
            onDismiss={closeRegionMenu}
            contentStyle={styles.menuContent}
            anchor={
              <Button
                mode="outlined"
                icon="menu-down"
                contentStyle={styles.buttonContent}
                style={menuButtonStyle}
                onPress={() => setRegionMenuVisible(true)}
              >
                {selectedRegionLabel}
              </Button>
            }
          >
            <Searchbar
              placeholder="Search region"
              value={regionQuery}
              onChangeText={setRegionQuery}
              style={styles.searchbar}
              inputStyle={styles.searchbarInput}
            />

            <ScrollView
              style={styles.menuList}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {filteredRegions.map((region) => (
                <Menu.Item
                  key={region.code}
                  title={region.name}
                  onPress={() => {
                    setSelectedRegion(region.code);
                    closeRegionMenu();
                  }}
                />
              ))}
              {filteredRegions.length === 0 && <Menu.Item title="No matching regions" disabled />}
            </ScrollView>
          </Menu>
        </View>

        <View style={[styles.field, isWide && styles.fieldWide]}>
          <Menu
            visible={cityMenuVisible}
            onDismiss={closeCityMenu}
            contentStyle={styles.menuContent}
            anchor={
              <Button
                mode="outlined"
                icon="menu-down"
                disabled={!selectedRegion}
                contentStyle={styles.buttonContent}
                style={menuButtonStyle}
                onPress={() => setCityMenuVisible(true)}
              >
                {selectedCityLabel}
              </Button>
            }
          >
            <Searchbar
              placeholder="Search city / municipality"
              value={cityQuery}
              onChangeText={setCityQuery}
              style={styles.searchbar}
              inputStyle={styles.searchbarInput}
            />
            <ScrollView
              style={styles.menuList}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {/* No city: the search covers the whole region */}
              <Menu.Item
                title="All cities / municipalities"
                leadingIcon="map-marker-multiple"
                onPress={() => {
                  setSelectedCityName('');
                  closeCityMenu();
                }}
              />
              {filteredCities.map((city) => (
                <Menu.Item
                  key={city.code}
                  title={city.name}
                  onPress={() => {
                    setSelectedCityName(city.name);
                    closeCityMenu();
                  }}
                />
              ))}
              {filteredCities.length === 0 && (
                <Menu.Item
                  title={cities.length === 0 ? 'Loading…' : 'No matching cities'}
                  disabled
                />
              )}
            </ScrollView>
          </Menu>
        </View>

        <Button
          mode="contained"
          icon="magnify"
          disabled={!selectedRegion}
          buttonColor={theme.colors.secondary}
          textColor={theme.colors.onSecondary}
          contentStyle={styles.buttonContent}
          style={[styles.searchButton, isWide && styles.searchButtonWide]}
          labelStyle={{ fontWeight: '700' }}
          onPress={handleSubmit}
        >
          Search
        </Button>
      </View>

      {selectedRegion && !selectedCityName ? (
        <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
          No city chosen: Search shows tourist spots from all of {selectedRegionDisplay} and its municipalities.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    width: '100%',
    marginBottom: 8,
  },
  filterLabel: {
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
    justifyContent: 'center',
  },
  chip: {
    borderRadius: 999,
  },
  row: {
    flexDirection: 'column',
    gap: 12,
    alignItems: 'stretch',
  },
  rowWide: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  field: {
    width: '100%',
  },
  fieldWide: {
    flex: 1,
    width: undefined,
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
    borderRadius: 999,
  },
  searchButtonWide: {
    width: 160,
  },

  hint: {
    textAlign: 'center',
    marginTop: 10,
  },
  menuContent: {
    minWidth: 320,
  },
  searchbar: {
    marginHorizontal: 8,
    marginBottom: 4,
    height: 44,
  },
  searchbarInput: {
    minHeight: 0,
    fontSize: 14,
  },
  menuList: {
    maxHeight: MENU_LIST_MAX_HEIGHT,
  },
});