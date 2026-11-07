import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { Image } from 'expo-image';
import { Button, Card, IconButton, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import { shareText } from '@/utils/shareText';
import { openInMaps, openRouteInMaps } from '@/utils/openInMaps';
import {
  createTrip,
  deleteTrip,
  moveSpot,
  removeSpotFromTrip,
  tripToText,
  useTrips,
  type Trip,
  type TripSpot,
} from '@/trips';

// Extra feature (not part of the assignment TODOs):
// plan trips from saved photo spots — create, reorder, remove, share and delete.
export default function TripsScreen() {
  const theme = useTheme();
  const trips = useTrips();
  const [newTripName, setNewTripName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newTripName.trim()) return;
    createTrip(newTripName);
    setNewTripName('');
  };

  const handleShare = async (trip: Trip) => {
    const result = await shareText(tripToText(trip), trip.name);
    if (result === 'copied') setMessage('Trip copied — paste it anywhere to share.');
    if (result === 'failed') setMessage("Couldn't open the share sheet on this device.");
  };

  // Two taps to delete: the first arms the button, the second deletes.
  const handleDelete = (tripId: string) => {
    if (confirmDeleteId === tripId) {
      deleteTrip(tripId);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(tripId);
    }
  };

  // Each place once, in trip order, for the Google Maps route.
  const tripPlaces = (trip: Trip) =>
    trip.spots
      .map((spot) => spot.place)
      .filter((place, i, all): place is string => !!place && all.indexOf(place) === i);

  const handleRoute = async (trip: Trip) => {
    const places = tripPlaces(trip);
    if (places.length === 0) {
      setMessage('Add spots from a search first, so the trip knows its places.');
      return;
    }
    const opened = await openRouteInMaps(places);
    if (!opened) setMessage("Couldn't open Google Maps.");
  };

  const openSpot = (spot: TripSpot) =>
    router.push({
      pathname: '/photo/[id]',
      params: {
        id: String(spot.id),
        imageUrl: spot.imageUrl,
        photographer: spot.photographer,
        photographerUrl: spot.photographerUrl,
        altText: spot.altText,
      },
    });

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ title: 'My Trips' }} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.createRow}>
          <TextInput
            mode="outlined"
            dense
            label="New trip"
            placeholder="e.g. Summer 2027"
            value={newTripName}
            onChangeText={setNewTripName}
            onSubmitEditing={handleCreate}
            style={styles.createInput}
          />
          <Button mode="contained" icon="plus" onPress={handleCreate} disabled={!newTripName.trim()}>
            Create
          </Button>
        </View>

        {trips.length === 0 && (
          <View style={styles.emptyState}>
            <Text variant="titleLarge">🧳</Text>
            <Text variant="bodyMedium" style={[styles.centerText, { color: theme.colors.onSurfaceVariant }]}>
              No trips yet. Create one above, or tap the suitcase on any photo to start planning.
            </Text>
          </View>
        )}

        {trips.map((trip) => (
          <Card key={trip.id} style={styles.tripCard} mode="elevated">
            <Card.Title
              title={trip.name}
              titleVariant="titleMedium"
              subtitle={`${trip.spots.length} ${trip.spots.length === 1 ? 'spot' : 'spots'}`}
              left={(props) => <IconButton {...props} icon="bag-suitcase" style={styles.noMargin} />}
              right={() => (
                <View style={styles.tripActions}>
                  <IconButton
                    icon="map-marker-path"
                    onPress={() => handleRoute(trip)}
                    accessibilityLabel={`Show ${trip.name} route in Google Maps`}
                  />
                  <IconButton
                    icon="share-variant"
                    onPress={() => handleShare(trip)}
                    accessibilityLabel={`Share ${trip.name}`}
                  />
                  <IconButton
                    icon={confirmDeleteId === trip.id ? 'delete-alert' : 'delete-outline'}
                    iconColor={confirmDeleteId === trip.id ? theme.colors.error : undefined}
                    onPress={() => handleDelete(trip.id)}
                    accessibilityLabel={
                      confirmDeleteId === trip.id ? `Tap again to delete ${trip.name}` : `Delete ${trip.name}`
                    }
                  />
                </View>
              )}
            />

            {confirmDeleteId === trip.id && (
              <Text variant="labelSmall" style={[styles.confirmText, { color: theme.colors.error }]}>
                Tap the red bin again to delete this trip.
              </Text>
            )}

            <Card.Content style={styles.spotList}>
              {trip.spots.length === 0 ? (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Empty trip — tap the suitcase on a photo to add spots.
                </Text>
              ) : (
                trip.spots.map((spot, index) => (
                  <View key={spot.id} style={[styles.spotRow, { borderColor: theme.colors.outlineVariant }]}>
                    <Text variant="labelLarge" style={styles.spotNumber}>
                      {index + 1}
                    </Text>
                    <Pressable onPress={() => openSpot(spot)} accessibilityLabel={`Open ${spot.altText}`}>
                      <Image
                        source={{ uri: spot.imageUrl }}
                        style={[styles.thumb, { backgroundColor: spot.avgColor ?? theme.colors.surfaceVariant }]}
                        contentFit="cover"
                      />
                    </Pressable>
                    <View style={styles.spotText}>
                      {!!spot.place && (
                        <Pressable
                          onPress={() => openInMaps(spot.place ?? '')}
                          accessibilityRole="link"
                          accessibilityLabel={`Open ${spot.place} in Google Maps`}
                        >
                          <Text variant="labelLarge" numberOfLines={1} style={{ color: theme.colors.primary }}>
                            📍 {spot.place}
                          </Text>
                        </Pressable>
                      )}
                      <Text variant="bodySmall" numberOfLines={2} style={{ color: theme.colors.onSurfaceVariant }}>
                        {spot.altText}
                      </Text>
                    </View>
                    <View style={styles.spotButtons}>
                      <IconButton
                        icon="chevron-up"
                        size={18}
                        disabled={index === 0}
                        onPress={() => moveSpot(trip.id, index, -1)}
                        accessibilityLabel="Move up"
                        style={styles.noMargin}
                      />
                      <IconButton
                        icon="chevron-down"
                        size={18}
                        disabled={index === trip.spots.length - 1}
                        onPress={() => moveSpot(trip.id, index, 1)}
                        accessibilityLabel="Move down"
                        style={styles.noMargin}
                      />
                    </View>
                    <IconButton
                      icon="close"
                      size={18}
                      onPress={() => removeSpotFromTrip(trip.id, spot.id)}
                      accessibilityLabel="Remove from trip"
                    />
                  </View>
                ))
              )}
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <Snackbar visible={!!message} onDismiss={() => setMessage(null)} duration={3000}>
        {message ?? ''}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createInput: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  centerText: {
    textAlign: 'center',
  },
  tripCard: {
    width: '100%',
  },
  tripActions: {
    flexDirection: 'row',
  },
  noMargin: {
    margin: 0,
  },
  confirmText: {
    marginHorizontal: 16,
    marginTop: -6,
    marginBottom: 6,
  },
  spotList: {
    gap: 8,
  },
  spotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  spotNumber: {
    width: 18,
    textAlign: 'center',
  },
  thumb: {
    width: 64,
    height: 48,
    borderRadius: 8,
  },
  spotText: {
    flex: 1,
    minWidth: 0,
  },
  spotButtons: {
    alignItems: 'center',
  },
});
