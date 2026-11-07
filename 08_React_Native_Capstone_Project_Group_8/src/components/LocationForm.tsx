
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, Menu } from 'react-native-paper';

import {
  getCitiesMunicipalitiesByProvince,
  getCitiesMunicipalitiesByRegion,
  getProvincesByRegion,
  getRegions,
  type City,
  type Province,
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
  // ======================================
  // LOCATION DATA
  // ======================================

  const [regions, setRegions] = useState<Region[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [municipalities, setMunicipalities] = useState<City[]>([]);

  // ======================================
  // SELECTED LOCATIONS
  // ======================================

  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');

  const [islandFilter, setIslandFilter] =
    useState<IslandFilter>('all');

  // ======================================
  // DROPDOWN VISIBILITY
  // ======================================

  const [regionMenuVisible, setRegionMenuVisible] = useState(false);
  const [provinceMenuVisible, setProvinceMenuVisible] = useState(false);
  const [cityMenuVisible, setCityMenuVisible] = useState(false);
  const [municipalityMenuVisible, setMunicipalityMenuVisible] =
    useState(false);

  // ======================================
  // FILTER REGIONS
  // ======================================

  const filteredRegions = useMemo<Region[]>(() => {
    if (islandFilter === 'all') {
      return regions;
    }

    return regions.filter(
      (region) =>
        region.islandGroupCode?.toLowerCase() === islandFilter,
    );
  }, [regions, islandFilter]);

  // ======================================
  // SELECTED LOCATION LABELS
  // ======================================

  const selectedRegionLabel =
    regions.find((region) => region.code === selectedRegion)?.name ||
    'Select Region';

  const selectedProvinceLabel =
    provinces.find((province) => province.code === selectedProvince)
      ?.name || 'Select Province';

  const selectedCityLabel =
    selectedCity
      ? cities.find((city) => city.code === selectedCity)?.name ||
        'Select City'
      : 'Select City';

  const selectedMunicipalityLabel =
    selectedMunicipality
      ? municipalities.find(
          (municipality) =>
            municipality.code === selectedMunicipality,
        )?.name || 'Select Municipality'
      : 'Select Municipality';

  const regionHasNoProvince =
    Boolean(selectedRegion) && provinces.length === 0;

  const canSelectLocality =
    Boolean(selectedRegion) &&
    (Boolean(selectedProvince) || regionHasNoProvince);

  // ======================================
  // LOAD REGIONS
  // ======================================

  useEffect(() => {
    let isActive = true;

    async function fetchRegions() {
      const regionsData = await getRegions();

      if (isActive) {
        setRegions(regionsData);
      }
    }

    fetchRegions();

    return () => {
      isActive = false;
    };
  }, []);

  // ======================================
  // LOAD PROVINCES WHEN REGION CHANGES
  // ======================================

  useEffect(() => {
    let isActive = true;

    async function fetchProvinces() {
      if (!selectedRegion) {
        setProvinces([]);
        setCities([]);
        setMunicipalities([]);
        return;
      }

      const provincesData =
        await getProvincesByRegion(selectedRegion);

      if (isActive) {
        setProvinces(provincesData);
      }
    }

    fetchProvinces();

    return () => {
      isActive = false;
    };
  }, [selectedRegion]);

  // ======================================
  // LOAD CITIES AND MUNICIPALITIES
  // ======================================

  useEffect(() => {
    let isActive = true;

    async function fetchLocalities() {
      setCities([]);
      setMunicipalities([]);

      if (!selectedRegion) {
        return;
      }

      let localities: City[] = [];

      if (selectedProvince) {
        localities =
          await getCitiesMunicipalitiesByProvince(
            selectedProvince,
          );
      } else {
        // NCR and other regions without provinces
        // load their localities directly from the region.
        const regionProvinces =
          await getProvincesByRegion(selectedRegion);

        if (regionProvinces.length === 0) {
          localities =
            await getCitiesMunicipalitiesByRegion(
              selectedRegion,
            );
        }
      }

      if (isActive) {
        setCities(
          localities.filter((item) => item.isCity === true),
        );

        setMunicipalities(
          localities.filter(
            (item) => item.isMunicipality === true,
          ),
        );
      }
    }

    fetchLocalities();

    return () => {
      isActive = false;
    };
  }, [selectedRegion, selectedProvince]);

  // ======================================
  // HANDLE ISLAND FILTER
  // ======================================

  const handleIslandFilter = (filter: IslandFilter) => {
    setIslandFilter(filter);

    setSelectedRegion('');
    setSelectedProvince('');
    setSelectedCity('');
    setSelectedMunicipality('');

    setProvinces([]);
    setCities([]);
    setMunicipalities([]);

    setRegionMenuVisible(false);
    setProvinceMenuVisible(false);
    setCityMenuVisible(false);
    setMunicipalityMenuVisible(false);
  };

  // ======================================
  // HANDLE REGION SELECTION
  // ======================================

  const handleRegionSelection = (regionCode: string) => {
    setSelectedRegion(regionCode);

    setSelectedProvince('');
    setSelectedCity('');
    setSelectedMunicipality('');

    setCities([]);
    setMunicipalities([]);

    setRegionMenuVisible(false);
    setProvinceMenuVisible(false);
    setCityMenuVisible(false);
    setMunicipalityMenuVisible(false);
  };

  // ======================================
  // HANDLE PROVINCE SELECTION
  // ======================================

  const handleProvinceSelection = (provinceCode: string) => {
    setSelectedProvince(provinceCode);

    setSelectedCity('');
    setSelectedMunicipality('');

    setCities([]);
    setMunicipalities([]);

    setProvinceMenuVisible(false);
    setCityMenuVisible(false);
    setMunicipalityMenuVisible(false);
  };

  // ======================================
  // HANDLE CITY SELECTION
  // ======================================

  const handleCitySelection = (cityCode: string) => {
    setSelectedCity(cityCode);
    setSelectedMunicipality('');

    setCityMenuVisible(false);
    setMunicipalityMenuVisible(false);
  };

  // ======================================
  // HANDLE MUNICIPALITY SELECTION
  // ======================================

  const handleMunicipalitySelection = (
    municipalityCode: string,
  ) => {
    setSelectedMunicipality(municipalityCode);
    setSelectedCity('');

    setMunicipalityMenuVisible(false);
    setCityMenuVisible(false);
  };

  // ======================================
  // SEARCH
  // ======================================

  const handleSubmit = () => {
    const selectedLocality =
      cities.find((city) => city.code === selectedCity) ||
      municipalities.find(
        (municipality) =>
          municipality.code === selectedMunicipality,
      );

    if (!selectedLocality) {
      return;
    }

    const provinceName =
      provinces.find(
        (province) => province.code === selectedProvince,
      )?.name || '';

    const regionName =
      regions.find((region) => region.code === selectedRegion)
        ?.name || '';

    const searchLocation = [
      selectedLocality.name,
      provinceName,
      regionName,
      'Philippines',
    ]
      .filter(Boolean)
      .join(', ');

    onSearch(searchLocation);
  };

  const hasSelectedLocality =
    Boolean(selectedCity) || Boolean(selectedMunicipality);

  // ======================================
  // UI
  // ======================================

  return (
    <View style={styles.form}>
      {/* ISLAND GROUP FILTER */}

      <View style={styles.filterRow}>
        {(['all', 'luzon', 'visayas', 'mindanao'] as const).map(
          (filter) => {
            const isSelected = islandFilter === filter;

            return (
              <Chip
                key={filter}
                selected={isSelected}
                onPress={() => handleIslandFilter(filter)}
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
                  : filter.charAt(0).toUpperCase() +
                    filter.slice(1)}
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
                onPress={() =>
                  handleRegionSelection(region.code)
                }
              />
            ))}
          </Menu>
        </View>

        {/* PROVINCE DROPDOWN */}

        <View style={styles.field}>
          <Menu
            visible={provinceMenuVisible}
            onDismiss={() => setProvinceMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                icon="menu-down"
                disabled={!selectedRegion || regionHasNoProvince}
                textColor={COLORS.emeraldDark}
                contentStyle={styles.buttonContent}
                style={styles.button}
                onPress={() => setProvinceMenuVisible(true)}
              >
                {regionHasNoProvince
                  ? 'No Province Required'
                  : selectedProvinceLabel}
              </Button>
            }
          >
            {provinces.map((province) => (
              <Menu.Item
                key={province.code}
                title={province.name}
                titleStyle={styles.menuText}
                onPress={() =>
                  handleProvinceSelection(province.code)
                }
              />
            ))}
          </Menu>
        </View>

        {/* MUNICIPALITY DROPDOWN */}

        <View style={styles.field}>
          <Menu
            visible={municipalityMenuVisible}
            onDismiss={() =>
              setMunicipalityMenuVisible(false)
            }
            anchor={
              <Button
                mode="outlined"
                icon="menu-down"
                disabled={
                  !canSelectLocality ||
                  municipalities.length === 0
                }
                textColor={COLORS.emeraldDark}
                contentStyle={styles.buttonContent}
                style={styles.button}
                onPress={() =>
                  setMunicipalityMenuVisible(true)
                }
              >
                {selectedMunicipalityLabel}
              </Button>
            }
          >
            {municipalities.map((municipality) => (
              <Menu.Item
                key={municipality.code}
                title={municipality.name}
                titleStyle={styles.menuText}
                onPress={() =>
                  handleMunicipalitySelection(
                    municipality.code,
                  )
                }
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
                disabled={
                  !canSelectLocality || cities.length === 0
                }
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
                onPress={() => handleCitySelection(city.code)}
              />
            ))}
          </Menu>
        </View>

        {/* SEARCH BUTTON */}

        <Button
          mode="contained"
          icon="magnify"
          disabled={!hasSelectedLocality}
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
