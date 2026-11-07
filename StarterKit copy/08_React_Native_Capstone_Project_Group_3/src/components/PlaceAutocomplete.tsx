import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { List, Searchbar, Surface } from 'react-native-paper';
import { searchPlaces, usePlaceIndex, type PlaceEntry } from '@/hooks/usePlaceIndex';

// Extra: a Paper Searchbar that suggests Philippine cities and municipalities as you type.
// Used by Quick search and by both inputs on the Compare screen.
export default function PlaceAutocomplete({
  value,
  onChangeText,
  onSelectPlace,
  onSubmit,
  placeholder = 'Type a place',
  loading = false,
  style,
  accessibilityLabel,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSelectPlace: (place: PlaceEntry) => void;
  onSubmit?: (text: string) => void;
  placeholder?: string;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const { places } = usePlaceIndex();
  const [open, setOpen] = useState(false);

  const suggestions = open ? searchPlaces(places, value) : [];

  const submitTyped = () => {
    setOpen(false);
    onSubmit?.(value);
  };

  return (
    <View style={style}>
      <Searchbar
        placeholder={placeholder}
        value={value}
        onChangeText={(text) => {
          onChangeText(text);
          setOpen(true);
        }}
        onSubmitEditing={submitTyped}
        onIconPress={submitTyped}
        onClearIconPress={() => setOpen(false)}
        returnKeyType="search"
        loading={loading}
        style={styles.searchbar}
        accessibilityLabel={accessibilityLabel ?? placeholder}
      />

      {suggestions.length > 0 && (
        <Surface style={styles.dropdown} elevation={3}>
          {suggestions.map((place) => (
            <List.Item
              key={place.code}
              title={place.displayName}
              description={[place.province, place.regionName].filter(Boolean).join(' · ')}
              titleNumberOfLines={1}
              descriptionNumberOfLines={1}
              left={(props) => (
                <List.Icon {...props} icon={place.isCity ? 'city-variant-outline' : 'home-group'} />
              )}
              onPress={() => {
                setOpen(false);
                onChangeText(place.displayName);
                onSelectPlace(place);
              }}
              accessibilityLabel={`Choose ${place.displayName}`}
            />
          ))}
        </Surface>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchbar: {
    borderRadius: 14,
  },
  dropdown: {
    marginTop: 6,
    borderRadius: 14,
    overflow: 'hidden',
  },
});
