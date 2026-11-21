import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, List, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import type { Photo } from '@/services/geoPhotoService';
import { addSpotToTrip, createTrip, useTrips } from '@/trips';

// Extra: pick a trip (or create one) to add a photo spot to.
export default function AddToTripDialog({
  photo,
  place,
  onDismiss,
}: {
  photo: Photo | null; // dialog is open while this is set
  place?: string;
  onDismiss: () => void;
}) {
  const theme = useTheme();
  const trips = useTrips();
  const [newTripName, setNewTripName] = useState('');

  const close = () => {
    setNewTripName('');
    onDismiss();
  };

  const addTo = (tripId: string) => {
    if (photo) addSpotToTrip(tripId, photo, place);
    close();
  };

  const createAndAdd = () => {
    const name = newTripName.trim();
    if (!name) return;
    addTo(createTrip(name));
  };

  return (
    <Portal>
      <Dialog visible={!!photo} onDismiss={close} style={styles.dialog}>
        <Dialog.Title>Add to trip</Dialog.Title>
        <Dialog.Content>
          {trips.length > 0 ? (
            <ScrollView style={styles.list}>
              {trips.map((trip) => {
                const alreadyIn = !!photo && trip.spots.some((spot) => spot.id === photo.id);
                return (
                  <List.Item
                    key={trip.id}
                    title={trip.name}
                    description={`${trip.spots.length} ${trip.spots.length === 1 ? 'spot' : 'spots'}`}
                    left={(props) => <List.Icon {...props} icon="bag-suitcase-outline" />}
                    right={(props) =>
                      alreadyIn ? <List.Icon {...props} icon="check" color={theme.colors.primary} /> : null
                    }
                    disabled={alreadyIn}
                    onPress={() => addTo(trip.id)}
                  />
                );
              })}
            </ScrollView>
          ) : (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              No trips yet — name your first one below.
            </Text>
          )}

          <View style={styles.newTripRow}>
            <TextInput
              mode="outlined"
              dense
              label="New trip name"
              placeholder="e.g. Summer 2027"
              value={newTripName}
              onChangeText={setNewTripName}
              onSubmitEditing={createAndAdd}
              style={styles.newTripInput}
            />
            <Button mode="contained" onPress={createAndAdd} disabled={!newTripName.trim()}>
              Create
            </Button>
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={close}>Cancel</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    maxWidth: 480,
    width: '92%',
    alignSelf: 'center',
  },
  list: {
    maxHeight: 240,
  },
  newTripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  newTripInput: {
    flex: 1,
  },
});
