import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import MediaGallery, { useFavorites } from '@/components/MediaGallery';
import { usePalette } from '@/themeMode';

export default function FavoritesScreen() {
    const p = usePalette();
    const { favorites } = useFavorites();

    return (
        <ScrollView style={{ backgroundColor: p.bg }} contentContainerStyle={styles.content}>
            <Text variant="headlineSmall" style={{ color: p.text, marginBottom: 16 }}>
                Your favorite spots
            </Text>

            {favorites.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={{ color: p.textSoft, textAlign: 'center' }}>
                        No favorites yet. Tap the heart on a photo to save it here.
                    </Text>
                </View>
            ) : (
                <MediaGallery photos={favorites} loading={false} />
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: { padding: 16, flexGrow: 1 },
    empty: { paddingVertical: 48 },
});