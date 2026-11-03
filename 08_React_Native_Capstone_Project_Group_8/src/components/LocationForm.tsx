import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, Menu } from 'react-native-paper';

import {
  getCitiesMunicipalitiesByRegion,
  getRegions,
  type City,
  type Region,
} from '@/services/geoPhotoService';

type IslandFilter = 'all' | 'luzon' | 'visayas' | 'mindanao';

// ======================================
// TROPICAL OCEAN + EMERALD COLORS
// ======================================

const COLORS = {
  emerald: '#0D9488',
  emeraldDark: '#0F766E',
  mint: '#D1FAE5',
  mintText: '#115E59',
  white: '#FFFFFF',
  border: '#99CFC5',
};

export default function LocationForm({
  onSearch,
}: {
  onSearch: (cityName: string) => void;
}) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedCityName, setSelectedCityName] = useState<string>('');

  const [islandFilter, setIslandFilter] = useState<IslandFilter>('all');

  const [regionMenuVisible, setRegionMenuVisible] = useState(false);
  const [cityMenuVisible, setCityMenuVisible] = useState(false);

  // ======================================
  // FILTER REGIONS
  // ======================================

  const filteredRegions = useMemo<Region[]>(() => {
    if (islandFilter === 'all') return regions;

    return regions.filter(
      (region) => region.islandGroupCode === islandFilter,
    );
  }, [regions, islandFilter]);

  // ======================================
  // RESET INVALID REGION SELECTION
  // ======================================

  useEffect(() => {
    if (islandFilter === 'all' || !selectedRegion) return;

    const stillVisible = filteredRegions.some(
      (region) => region.code === selectedRegion,
    );

    if (!stillVisible) {
      setSelectedRegion('');
      setSelectedCityName('');
      setCityMenuVisible(false);
    }
  }, [islandFilter, selectedRegion, filteredRegions]);

  // ======================================
  // LOAD REGIONS
  // ======================================

  useEffect(() => {
    async function fetchRegions() {
      const regionsData = await getRegions();
      setRegions(regionsData);
    }

    fetchRegions();
  }, []);

  // ======================================
  // LOAD CITIES
  // ======================================

  useEffect(() => {
    async function fetchCities() {
      if (selectedRegion) {
        const citiesData =
          await getCitiesMunicipalitiesByRegion(selectedRegion);

        setCities(citiesData);
      } else {
        setCities([]);
      }

      setSelectedCityName('');
    }

    fetchCities();
  }, [selectedRegion]);

  // ======================================
  // SEARCH
  // ======================================

  const handleSubmit = () => {
    if (selectedCityName) {
      onSearch(selectedCityName);
    }
  };

  const selectedRegionLabel =
    regions.find((region) => region.code === selectedRegion)?.name ??
    'Select Region';

  const selectedCityLabel =
    selectedCityName || 'Select City / Municipality';

  // ======================================
  // UI
  // ======================================

  return (
    <View style={styles.form}>
      {/* ISLAND FILTER */}

      <View style={styles.filterRow}>
        {(['all', 'luzon', 'visayas', 'mindanao'] as const).map(
          (filter) => {
            const isSelected = islandFilter === filter;

            return (
              <Chip
                key={filter}
                selected={isSelected}
                onPress={() => setIslandFilter(filter)}
                selectedColor={COLORS.emeraldDark}
                textStyle={{
                  color: isSelected
                    ? COLORS.white
                    : COLORS.mintText,
                  fontWeight: '600',
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected
                      ? COLORS.emerald
                      : COLORS.mint,
                  },
                ]}
              >
                {filter === 'all'
                  ? 'All'
                  : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Chip>
            );
          },
        )}
      </View>

      {/* REGION DROPDOWN */}

      <View style={styles.row}>
        <View style={styles.field}>
          <Menu
            visible={regionMenuVisible}
            onDismiss={() => setRegionMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                icon="menu-down"
                textColor={COLORS.emeraldDark}
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
                titleStyle={styles.menuText}
                onPress={() => {
                  setSelectedRegion(region.code);
                  setRegionMenuVisible(false);
                }}
              />
            ))}
          </Menu>
        </View>

        {/* CITY DROPDOWN */}

        <View style={styles.field}>
          <Menu
            visible={cityMenuVisible}
            onDismiss={() => setCityMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                icon="menu-down"
                disabled={!selectedRegion}
                textColor={COLORS.emeraldDark}
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
                titleStyle={styles.menuText}
                onPress={() => {
                  setSelectedCityName(city.name);
                  setCityMenuVisible(false);
                }}
              />
            ))}
          </Menu>
        </View>

        {/* SEARCH BUTTON */}

        <Button
          mode="contained"
          icon="magnify"
          disabled={!selectedCityName}
          buttonColor={COLORS.emerald}
          textColor={COLORS.white}
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

// ======================================
// STYLES
// ======================================

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
    borderRadius: 10,
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
    borderColor: COLORS.border,
    borderRadius: 14,
  },

  buttonContent: {
    paddingVertical: 6,
  },

  searchButton: {
    width: '100%',
    borderRadius: 14,
  },

  menuText: {
    color: COLORS.emeraldDark,
  },
});
