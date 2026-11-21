import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Card, IconButton, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCachedPhoto, useEngagement, type SavedPhoto } from '@/services/geoPhotoService';

export default function SavedScreen() {
  const theme = useTheme();
  const { likes, favorites, toggleLike, toggleFavorite } = useEngagement();
  const [tab, setTab] = useState<'likes' | 'favorites'>('likes');

  const ids = Array.from(tab === 'likes' ? likes : favorites).reverse();
  const items = ids.map((id) => getCachedPhoto(id)).filter((p): p is SavedPhoto => !!p);

  const openDetail = (p: SavedPhoto) =>
    router.push({
      pathname: '/photo/[id]',
      params: {
        id: String(p.id),
        imageUrl: p.imageUrl,
        photographer: p.photographer,
        photographerUrl: p.photographerUrl,
        altText: p.altText,
        location: p.location,
      },
    });

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.primary }]}>
          Saved Spots
        </Text>

        <SegmentedButtons
          value={tab}
          onValueChange={(v) => setTab(v as 'likes' | 'favorites')}
          buttons={[
            { value: 'likes', label: `Liked (${likes.size})`, icon: 'heart' },
            { value: 'favorites', label: `Favorites (${favorites.size})`, icon: 'star' },
          ]}
          style={styles.switch}
        />

        {items.length === 0 ? (
          <Text variant="bodyLarge" style={[styles.empty, { color: theme.colors.onSurfaceVariant }]}>
            {tab === 'likes'
              ? 'No liked photos yet. Tap the heart on a tourist spot! ❤️'
              : 'No favorites yet. Tap the star on a tourist spot! ⭐'}
          </Text>
        ) : (
          <View style={styles.grid}>
            {items.map((p) => {
              const id = String(p.id);
              return (
                <View key={id} style={styles.gridItem}>
                  <Card style={styles.card} elevation={2}>
                    <Pressable onPress={() => openDetail(p)}>
                      <Card.Cover source={{ uri: p.imageUrl }} accessibilityLabel={p.altText} />
                    </Pressable>
                    <Card.Content style={styles.cardContent}>
                      <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
                        📍 {p.location}
                      </Text>
                      <Text variant="bodyMedium" numberOfLines={2} style={styles.caption}>
                        {p.altText}
                      </Text>
                      <Text variant="labelSmall" style={{ opacity: 0.7 }}>
                        📸 {p.photographer}
                      </Text>
                    </Card.Content>
                    <View style={styles.actions}>
                      <IconButton
                        icon={tab === 'likes' ? 'heart' : 'star'}
                        iconColor={tab === 'likes' ? '#E11D48' : '#F59E0B'}
                        onPress={() => (tab === 'likes' ? toggleLike(id) : toggleFavorite(id))}
                        accessibilityLabel="Remove"
                      />
                    </View>
                  </Card>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  title: { fontWeight: '800', textAlign: 'center', marginTop: 16, marginBottom: 16 },
  switch: { marginBottom: 20 },
  empty: { textAlign: 'center', marginTop: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  gridItem: { flexGrow: 1, flexBasis: '30%', minWidth: 240 },
  card: { width: '100%', overflow: 'hidden', borderRadius: 20 },
  cardContent: { paddingTop: 12, gap: 2 },
  caption: { fontWeight: '600', marginBottom: 4 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 4 },
});