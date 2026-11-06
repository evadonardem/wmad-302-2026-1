import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, Menu, Surface, Text, useTheme } from 'react-native-paper';
import {
  getCitiesMunicipalitiesByRegion,
  getRegions,
  type City,
  type Region,
} from '@/services/geoPhotoService';

export default function LocationForm({ onSearch }: { onSearch: (cityName: string) => void }) {
  const theme = useTheme();
  const [regions, setRegions] = useState<Region[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCityName, setSelectedCityName] = useState('');
  const [islandFilter, setIslandFilter] = useState<'all' | 'luzon' | 'visayas' | 'mindanao'>('all');

  const [regionMenuVisible, setRegionMenuVisible] = useState(false);
  const [cityMenuVisible, setCityMenuVisible] = useState(false);

  useEffect(() => {
    let active = true;
    getRegions().then((data) => {
      if (active) setRegions(data);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedRegion) return;

    let active = true;
    getCitiesMunicipalitiesByRegion(selectedRegion).then((data) => {
      if (active) setCities(data);
    });
    return () => {
      active = false;
    };
  }, [selectedRegion]);

  const handleSubmit = () => {
    if (selectedCityName) onSearch(selectedCityName);
  };

  const filteredRegions = useMemo(
    () => islandFilter === 'all' ? regions : regions.filter((region) => region.islandGroupCode === islandFilter),
    [islandFilter, regions],
  );

  const selectedRegionLabel = regions.find((r) => r.code === selectedRegion)?.name ?? 'Select Region';
  const selectedCityLabel = selectedCityName || 'Select City / Municipality';

  return (
    <Surface style={[styles.form, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <Text variant="titleMedium" style={styles.formTitle}>Where will you go?</Text>
      <Text variant="bodySmall" style={styles.formHint}>Choose an island group, then pick a destination.</Text>
      <View style={styles.filterRow}>
        {(['all', 'luzon', 'visayas', 'mindanao'] as const).map((filter) => (
          <Chip
            key={filter}
            selected={islandFilter === filter}
            onPress={() => {
              setIslandFilter(filter);
              if (selectedRegion && filter !== 'all' && regions.find((region) => region.code === selectedRegion)?.islandGroupCode !== filter) {
                setSelectedRegion('');
                setSelectedCityName('');
                setCities([]);
              }
            }}
          >
            {filter === 'all' ? 'All islands' : filter[0].toUpperCase() + filter.slice(1)}
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
            {filteredRegions.map((region) => (
              <Menu.Item
                key={region.code}
                title={region.name}
                onPress={() => {
                  setSelectedRegion(region.code);
                  setSelectedCityName('');
                  setCities([]);
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
    </Surface>
  );
}

const styles = StyleSheet.create({
  form: {
    width: '100%',
    marginBottom: 28,
    padding: 16,
    borderRadius: 22,
  },
  formTitle: {
    fontWeight: '800',
    marginBottom: 4,
  },
  formHint: {
    opacity: 0.7,
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
    justifyContent: 'flex-start',
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
});
