import React from 'react';
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

export default function LocationForm({ onSearch }: { onSearch: (cityName: string) => void }) {
  // TODO 2.1 ✅ COMPLETED
  const [regions, setRegions] = useState<Region[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedCityName, setSelectedCityName] = useState<string>('');

  // TODO 2.5 + 2.9 ✅ COMPLETED — Island Filter State
  const [islandFilter, setIslandFilter] = useState<IslandFilter>('all');

  // TODO 2.9b ✅ COMPLETED — Filtered Regions List
  const filteredRegions = useMemo<Region[]>(() => {
    if (islandFilter === 'all') return regions;
    return regions.filter((region) => region.islandGroupCode === islandFilter);
  }, [regions, islandFilter]);

  // TODO 2.9d ✅ COMPLETED — Safety Reset Effect
  useEffect(() => {
    if (islandFilter === 'all' || !selectedRegion) return;

    const stillVisible = filteredRegions.some((region) => region.code === selectedRegion);
    if (!stillVisible) {
      setSelectedRegion('');
      setSelectedCityName('');
      setCityMenuVisible(false);
    }
  }, [islandFilter, selectedRegion, filteredRegions]);

  const [regionMenuVisible, setRegionMenuVisible] = useState(false);
  const [cityMenuVisible, setCityMenuVisible] = useState(false);

  useEffect(() => {
    // TODO 2.2 ✅ COMPLETED — Load Regions on Mount
    async function fetchRegions() {
      const regionsData = await getRegions();
      setRegions(regionsData);
    }
    fetchRegions();
  }, []);

  useEffect(() => {
    // TODO 2.3 ✅ COMPLETED — Load Cities on Region Change
    async function fetchCities() {
      if (selectedRegion) {
        const citiesData = await getCitiesMunicipalitiesByRegion(selectedRegion);
        setCities(citiesData);
      } else {
        setCities([]);
      }
      setSelectedCityName(''); // Clear stale city when region changes
    }
    fetchCities();
  }, [selectedRegion]);

  const handleSubmit = () => {
    // TODO 2.4 ✅ COMPLETED — Submit Handler
    if (selectedCityName) {
      onSearch(selectedCityName);
    }
  };

  const selectedRegionLabel = regions.find((r) => r.code === selectedRegion)?.name ?? 'Select Region';
  const selectedCityLabel = selectedCityName || 'Select City / Municipality';

  return (
    <View style={styles.form}>
      {/* TODO 2.9c ✅ COMPLETED — Chip Filter Row */}
      <View style={styles.filterRow}>
        {(['all', 'luzon', 'visayas', 'mindanao'] as const).map((filter) => (
          <Chip
            key={filter}
            selected={islandFilter === filter}
            onPress={() => setIslandFilter(filter)}
            style={styles.filterChip}
          >
            {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
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
            {/* TODO 2.6 ✅ COMPLETED — Region Menu Map */}
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
            {/* TODO 2.8 ✅ COMPLETED — City Menu Map */}
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
  filterChip: {
    marginHorizontal: 2,
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