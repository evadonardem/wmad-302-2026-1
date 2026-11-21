import React, { useEffect, useState } from 'react';
import {Pressable,ScrollView,StyleSheet,View,} from 'react-native';
import { Button, Chip, Icon, Text, TextInput, useTheme } from 'react-native-paper';
import {City,Region,getCitiesMunicipalitiesByRegion,getRegions,} from '@/services/geoPhotoService';

interface LocationFormProps {
  onSearch: (locationName: string) => void;
}

export default function LocationForm({ onSearch }: LocationFormProps) {
  const theme = useTheme();

  const [regions, setRegions] = useState<Region[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  // Selected Entities & Filters
  const [selectedIslandGroup, setSelectedIslandGroup] = useState<string>('All');
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  // Live Type Search State inside Dropdowns
  const [regionSearchText, setRegionSearchText] = useState('');
  const [citySearchText, setCitySearchText] = useState('');

  // Dropdown Open States
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  useEffect(() => {
    let active = true;
    getRegions()
      .then((data) => {
        if (active) setRegions(data);
      })
      .catch((err) => console.error('Error fetching regions:', err));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (selectedRegion) {
      // FETCH ONLY CITIES AND MUNICIPALITIES BELONGING TO THE SELECTED REGION (e.g. CAR)
      getCitiesMunicipalitiesByRegion(selectedRegion.code)
        .then((data) => {
          if (active) {
            // Filter further by region code to strictly ensure only cities in this region are shown
            const regionCities = data.filter(
              (c) =>
                !c.regionCode ||
                c.regionCode.toLowerCase() === selectedRegion.code.toLowerCase(),
            );
            setCities(regionCities);
          }
        })
        .catch((err) => console.error('Error fetching cities for region:', err));
    } else {
      setCities([]);
    }
    return () => {
      active = false;
    };
  }, [selectedRegion]);

  const palette = theme.dark
    ? {
        cardBg: 'rgba(10, 32, 21, 0.95)',
        border: 'rgba(90, 168, 117, 0.35)',
        inputBg: 'rgba(15, 43, 27, 0.85)',
        text: '#F2F8EE',
        muted: '#A2C4A7',
        primary: '#43A047',
        dropdownBg: '#0D2D1B',
        hoverBg: 'rgba(67, 160, 71, 0.3)',
        chipBg: 'rgba(15, 43, 27, 0.6)',
      }
    : {
        cardBg: 'rgba(240, 249, 242, 0.95)',
        border: 'rgba(0, 105, 92, 0.25)',
        inputBg: 'rgba(255, 255, 255, 0.85)',
        text: '#0D2D1B',
        muted: '#546E7A',
        primary: '#00695C',
        dropdownBg: '#FFFFFF',
        hoverBg: 'rgba(0, 105, 92, 0.08)',
        chipBg: '#FFFFFF',
      };

  // Filter & Sort Regions Alphabetically (A to Z)
  const filteredRegions = regions
    .filter((r) => {
      const matchesIsland =
        selectedIslandGroup === 'All' ||
        r.islandGroupCode?.toLowerCase() === selectedIslandGroup.toLowerCase();
      const matchesSearch =
        !regionSearchText.trim() ||
        r.name.toLowerCase().includes(regionSearchText.toLowerCase());
      return matchesIsland && matchesSearch;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Filter & Sort Cities Alphabetically (A to Z) FOR THE SELECTED REGION ONLY
  const filteredCities = cities
    .filter((c) => {
      return (
        !citySearchText.trim() ||
        c.name.toLowerCase().includes(citySearchText.toLowerCase())
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleSelectRegion = (region: Region) => {
    // TODO 2.3 [Input Handler Mechanics]: Set selected region state
    setSelectedRegion(region);
    setShowRegionDropdown(false);
    setRegionSearchText('');

    // Clear previously selected city so user picks a new city from the selected region
    setSelectedCity(null);
    setShowCityDropdown(false);
    setCitySearchText('');
  };

  const handleSelectCity = (city: City) => {
    // TODO 2.4 [Dropdown Population Pipeline]: Set selected city state
    setSelectedCity(city);
    setShowCityDropdown(false);
    setCitySearchText('');
  };

  const handleSubmit = () => {
    // TODO 2.5 [Form Submission Validation]: Trigger parent onSearch
    setShowRegionDropdown(false);
    setShowCityDropdown(false);

    const query = selectedCity?.name || selectedRegion?.name || '';
    if (query) {
      onSearch(query);
    }
  };

  const isDropdownOpen = showRegionDropdown || showCityDropdown;
  const islandGroups = ['All', 'Luzon', 'Visayas', 'Mindanao'];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.cardBg,
          borderColor: palette.border,
          zIndex: isDropdownOpen ? 999999 : 100,
          elevation: isDropdownOpen ? 100 : 6,
        },
      ]}
    >
      {/* TITLE & SUBTITLE HEADER */}
      <View style={styles.headerRow}>
        <Text style={styles.headerEmoji}>🌱</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.mainTitle, { color: palette.text }]}>
            Find your nature escape
          </Text>
          <Text style={[styles.mainSubtitle, { color: palette.muted }]}>
            Choose a Philippine destination to explore.
          </Text>
        </View>
      </View>

      {/* CHOOSE AN ISLAND GROUP CHIPS */}
      <View style={styles.islandGroupSection}>
        <Text style={[styles.sectionLabel, { color: palette.text }]}>
          CHOOSE AN ISLAND GROUP
        </Text>
        <View style={styles.chipsRow}>
          {islandGroups.map((group) => {
            const isSelected = selectedIslandGroup === group;
            return (
              <Chip
                key={group}
                selected={isSelected}
                showSelectedCheck={isSelected}
                onPress={() => {
                  setSelectedIslandGroup(group);
                  setSelectedRegion(null);
                  setSelectedCity(null);
                  setShowRegionDropdown(false);
                  setShowCityDropdown(false);
                }}
                style={[
                  styles.islandChip,
                  {
                    backgroundColor: isSelected
                      ? palette.primary
                      : palette.chipBg,
                    borderColor: palette.border,
                  },
                ]}
                textStyle={{
                  color: isSelected ? '#FFFFFF' : palette.text,
                  fontWeight: '700',
                  fontSize: 13,
                }}
              >
                {group}
              </Chip>
            );
          })}
        </View>
      </View>

      {/* 2-COLUMN SIDE-BY-SIDE DROPDOWN INPUTS */}
      <View style={[styles.twoColumnRow, { zIndex: isDropdownOpen ? 999999 : 10 }]}>
        {/* LEFT COLUMN: REGION DROPDOWN */}
        <View style={[styles.columnWrapper, { zIndex: showRegionDropdown ? 999999 : 50 }]}>
          <Text style={[styles.fieldLabel, { color: palette.text }]}>REGION</Text>

          <Pressable
            onPress={() => {
              setShowRegionDropdown((prev) => !prev);
              setShowCityDropdown(false);
            }}
            style={[
              styles.selectPill,
              { backgroundColor: palette.inputBg, borderColor: palette.border },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.selectValueText,
                { color: selectedRegion ? palette.text : palette.muted },
              ]}
            >
              {selectedRegion ? selectedRegion.name : 'Select Region'}
            </Text>

            <View style={styles.iconRight}>
              <Icon source="map-marker-outline" size={18} color={palette.primary} />
            </View>
          </Pressable>

          {/* FLOATING DROPDOWN FOR REGIONS */}
          {showRegionDropdown && (
            <View
              style={[
                styles.floatingDropdown,
                { backgroundColor: palette.dropdownBg, borderColor: palette.border },
              ]}
            >
              <View style={styles.dropdownSearchBox}>
                <TextInput
                  mode="outlined"
                  dense
                  placeholder="Type to filter regions..."
                  placeholderTextColor={palette.muted}
                  value={regionSearchText}
                  onChangeText={setRegionSearchText}
                  left={<TextInput.Icon icon="magnify" size={16} color={palette.primary} />}
                  right={
                    regionSearchText ? (
                      <TextInput.Icon
                        icon="close-circle-outline"
                        size={16}
                        color={palette.muted}
                        onPress={() => setRegionSearchText('')}
                      />
                    ) : null
                  }
                  textColor={palette.text}
                  style={[styles.dropdownSearchInput, { backgroundColor: palette.inputBg }]}
                  outlineStyle={{ borderRadius: 12, borderColor: palette.border }}
                />
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                showsVerticalScrollIndicator={true}
                style={{ maxHeight: 160 }}
              >
                {filteredRegions.length === 0 ? (
                  <View style={styles.noMatchBox}>
                    <Text style={{ fontSize: 12, color: palette.muted }}>No regions found</Text>
                  </View>
                ) : (
                  filteredRegions.map((item) => (
                    <Pressable
                      key={item.code}
                      onPress={() => handleSelectRegion(item)}
                      style={({ pressed }) => [
                        styles.dropdownRow,
                        pressed && { backgroundColor: palette.hoverBg },
                      ]}
                    >
                      <Icon source="map-marker-outline" size={16} color={palette.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.dropdownItemText, { color: palette.text }]}>
                          {item.name}
                        </Text>
                        {item.islandGroupCode && (
                          <Text style={[styles.islandSubtext, { color: palette.muted }]}>
                            ISLAND GROUP: {item.islandGroupCode.toUpperCase()}
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  ))
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {/* RIGHT COLUMN: CITY / MUNICIPALITY DROPDOWN */}
        <View style={[styles.columnWrapper, { zIndex: showCityDropdown ? 999999 : 40 }]}>
          <Text style={[styles.fieldLabel, { color: palette.text }]}>CITY / MUNICIPALITY</Text>

          <Pressable
            disabled={!selectedRegion}
            onPress={() => {
              setShowCityDropdown((prev) => !prev);
              setShowRegionDropdown(false);
            }}
            style={[
              styles.selectPill,
              {
                backgroundColor: palette.inputBg,
                borderColor: palette.border,
                opacity: selectedRegion ? 1 : 0.6,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.selectValueText,
                { color: selectedCity ? palette.text : palette.muted },
              ]}
            >
              {selectedCity
                ? selectedCity.name
                : selectedRegion
                  ? `Select City in ${selectedRegion.name}`
                  : 'Select Region First'}
            </Text>

            <View style={styles.iconRight}>
              <Icon source="city-variant-outline" size={18} color={palette.primary} />
            </View>
          </Pressable>

          {/* FLOATING DROPDOWN FOR REGION-SPECIFIC CITIES */}
          {showCityDropdown && (
            <View
              style={[
                styles.floatingDropdown,
                { backgroundColor: palette.dropdownBg, borderColor: palette.border },
              ]}
            >
              <View style={styles.dropdownSearchBox}>
                <TextInput
                  mode="outlined"
                  dense
                  placeholder={`Type city in ${selectedRegion?.name || 'Region'}...`}
                  placeholderTextColor={palette.muted}
                  value={citySearchText}
                  onChangeText={setCitySearchText}
                  left={<TextInput.Icon icon="magnify" size={16} color={palette.primary} />}
                  right={
                    citySearchText ? (
                      <TextInput.Icon
                        icon="close-circle-outline"
                        size={16}
                        color={palette.muted}
                        onPress={() => setCitySearchText('')}
                      />
                    ) : null
                  }
                  textColor={palette.text}
                  style={[styles.dropdownSearchInput, { backgroundColor: palette.inputBg }]}
                  outlineStyle={{ borderRadius: 12, borderColor: palette.border }}
                />
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                showsVerticalScrollIndicator={true}
                style={{ maxHeight: 160 }}
              >
                {filteredCities.length === 0 ? (
                  <View style={styles.noMatchBox}>
                    <Text style={{ fontSize: 12, color: palette.muted }}>
                      No cities found in {selectedRegion?.name || 'selected region'}
                    </Text>
                  </View>
                ) : (
                  filteredCities.map((item) => (
                    <Pressable
                      key={item.code}
                      onPress={() => handleSelectCity(item)}
                      style={({ pressed }) => [
                        styles.dropdownRow,
                        pressed && { backgroundColor: palette.hoverBg },
                      ]}
                    >
                      <Icon source="city-variant-outline" size={16} color={palette.primary} />
                      <Text style={[styles.dropdownItemText, { color: palette.text }]}>
                        {item.name}
                      </Text>
                    </Pressable>
                  ))
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* DISCOVER DESTINATIONS BUTTON */}
      <View style={styles.buttonWrapper}>
        <Button
          mode="contained"
          disabled={!selectedRegion && !selectedCity}
          buttonColor={
            selectedRegion || selectedCity ? palette.primary : 'rgba(0,0,0,0.12)'
          }
          textColor={selectedRegion || selectedCity ? '#FFFFFF' : palette.muted}
          onPress={handleSubmit}
          icon="compass-outline"
          style={styles.submitBtn}
          contentStyle={{ height: 48 }}
          labelStyle={{ fontWeight: '800', fontSize: 15 }}
        >
          Discover Destinations
        </Button>

        <Text style={[styles.taglineText, { color: palette.muted }]}>
          ✦ Your next adventure is waiting.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 22,
    borderRadius: 24,
    borderWidth: 1.5,
    marginBottom: 20,
    position: 'relative',
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerEmoji: {
    fontSize: 28,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  mainSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  islandGroupSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  islandChip: {
    borderRadius: 20,
    borderWidth: 1,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 14,
    width: '100%',
    position: 'relative',
  },
  columnWrapper: {
    flex: 1,
    position: 'relative',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  selectPill: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 16,
    paddingRight: 14,
  },
  selectValueText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  iconRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWrapper: {
    position: 'relative',
    zIndex: 1,
    gap: 10,
    alignItems: 'center',
  },
  submitBtn: {
    width: '100%',
    borderRadius: 24,
  },
  taglineText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  floatingDropdown: {
    position: 'absolute',
    top: 76,
    left: 0,
    right: 0,
    borderRadius: 18,
    borderWidth: 1.5,
    elevation: 100,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    zIndex: 999999,
    overflow: 'hidden',
    paddingBottom: 6,
  },
  dropdownSearchBox: {
    padding: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  dropdownSearchInput: {
    fontSize: 12,
  },
  noMatchBox: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: '700',
  },
  islandSubtext: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
});