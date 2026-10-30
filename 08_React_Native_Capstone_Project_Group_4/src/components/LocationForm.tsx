import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Menu, SegmentedButtons, useTheme } from 'react-native-paper';
import {
  getCitiesMunicipalitiesByRegion,
  getRegions,
  type CityMunicipality,
  type Region,
} from '@/services/geoPhotoService';

interface LocationFormProps {
  onSearch: (city: CityMunicipality) => void;
}

export default function LocationForm({ onSearch }: LocationFormProps) {
  const theme = useTheme();
  const [islandFilter, setIslandFilter] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityMunicipality | null>(null);

  const [regions, setRegions] = useState<Region[]>([]);
  const [cities, setCities] = useState<CityMunicipality[]>([]);

  const [regionMenuVisible, setRegionMenuVisible] = useState(false);
  const [cityMenuVisible, setCityMenuVisible] = useState(false);

  useEffect(() => {
    async function loadRegions() {
      const allRegions = await getRegions();
      if (islandFilter === 'all') {
        setRegions(allRegions);
      } else {
        const filtered = allRegions.filter(
          (r) => r.islandGroup?.toLowerCase() === islandFilter.toLowerCase()
        );
        setRegions(filtered);
      }
    }
    loadRegions();
  }, [islandFilter]);

  useEffect(() => {
    async function loadCities() {
      if (!selectedRegion) {
        setCities([]);
        return;
      }
      const regionCities = await getCitiesMunicipalitiesByRegion(selectedRegion.code);
      setCities(regionCities);
    }
    loadCities();
  }, [selectedRegion]);

  return (
    <View style={styles.formContainer}>
      <SegmentedButtons
        value={islandFilter}
        onValueChange={(val) => {
          setIslandFilter(val);
          setSelectedRegion(null);
          setSelectedCity(null);
        }}
        buttons={[
          { value: 'all', label: '✓ All' },
          { value: 'luzon', label: 'Luzon' },
          { value: 'visayas', label: 'Visayas' },
          { value: 'mindanao', label: 'Mindanao' },
        ]}
        style={styles.segmentedButtons}
      />

      <View style={styles.pickerRow}>
        <View style={styles.pickerItem}>
          <Menu
            visible={regionMenuVisible}
            onDismiss={() => setRegionMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setRegionMenuVisible(true)}
                icon="map-marker-outline"
                contentStyle={styles.buttonContent}
                textColor={theme.colors.onSurface}
                style={[styles.pickerButton, { borderColor: theme.colors.outline }]}
              >
                {selectedRegion ? selectedRegion.name : 'Select Region'}
              </Button>
            }
          >
            <ScrollView style={styles.dropdownScroll}>
              {regions.map((region) => (
                <Menu.Item
                  key={region.code}
                  onPress={() => {
                    setSelectedRegion(region);
                    setSelectedCity(null);
                    setRegionMenuVisible(false);
                  }}
                  title={region.name}
                />
              ))}
            </ScrollView>
          </Menu>
        </View>

        <View style={styles.pickerItem}>
          <Menu
            visible={cityMenuVisible}
            onDismiss={() => setCityMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                disabled={!selectedRegion}
                onPress={() => setCityMenuVisible(true)}
                icon="city"
                contentStyle={styles.buttonContent}
                textColor={theme.colors.onSurface}
                style={[styles.pickerButton, { borderColor: theme.colors.outline }]}
              >
                {selectedCity ? selectedCity.name : 'Select City / Municipality'}
              </Button>
            }
          >
            <ScrollView style={styles.dropdownScroll}>
              {cities.map((city) => (
                <Menu.Item
                  key={city.code}
                  onPress={() => {
                    // Pipiliin lang muna ang city nang hindi pa nagse-search
                    setSelectedCity(city);
                    setCityMenuVisible(false);
                  }}
                  title={city.name}
                />
              ))}
            </ScrollView>
          </Menu>
        </View>
      </View>

      {/* Dito na lang lang mag-e-execute kapag clinic ang Search button */}
      <Button
        mode="contained"
        icon="magnify"
        disabled={!selectedCity}
        onPress={() => {
          if (selectedCity) {
            onSearch(selectedCity);
          }
        }}
        style={styles.searchButton}
        contentStyle={{ paddingVertical: 6 }}
        labelStyle={{ fontWeight: '800', fontSize: 16, color: '#0f172a' }}
        buttonColor="#00f3ff"
      >
        Search
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
    gap: 16,
  },
  segmentedButtons: {
    maxWidth: 520,
    alignSelf: 'center',
    width: '100%',
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },
  pickerItem: {
    flex: 1,
    minWidth: 260,
  },
  pickerButton: {
    borderRadius: 14,
    width: '100%',
  },
  buttonContent: {
    height: 48,
  },
  dropdownScroll: {
    maxHeight: 280,
  },
  searchButton: {
    borderRadius: 14,
    marginTop: 4,
  },
});