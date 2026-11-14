/**
 * My Recipes - recipes whose userId matches the signed-in user
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { recipeApi } from '@/services/recipeApi';
import { Recipe } from '@/types/recipe';
import { routes } from '@/utils/routes';
import { EmptyState, ErrorState, RecipeListItem } from '@/components';
import { createStyles, useAppTheme } from '@/context/ThemeContext';

export default function MyRecipesScreen() {
    useAppTheme();
    const router = useRouter();
    const { user } = useAuth();
    const { isFavorite, toggleFavorite } = useFavorites();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    const userId = user?.id;

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        recipeApi
            .getAllRecipes()
            .then((all) => !cancelled && setRecipes(all.filter((r) => r.userId === userId)))
            .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Failed to load recipes'))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [userId, reloadKey]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#D81B60" />
            </View>
        );
    }
    if (error) {
        return (
            <View style={styles.center}>
                <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
            </View>
        );
    }

    return (
        <FlatList
            style={styles.container}
            contentContainerStyle={styles.content}
            data={recipes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
                <RecipeListItem
                    recipe={item}
                    onPress={() => router.push(routes.recipe(item.id))}
                    isFavorite={isFavorite(item.id)}
                    onToggleFavorite={() => toggleFavorite(item.id)}
                />
            )}
            ListEmptyComponent={
                <EmptyState
                    icon="book-open-page-variant-outline"
                    title="No recipes yet"
                    message="Recipes linked to your account will show up here."
                    actionLabel="Discover recipes"
                    onAction={() => router.push(routes.home)}
                />
            }
        />
    );
}

const styles = createStyles({
    container: { flex: 1, backgroundColor: '#FEF9FB' },
    content: { padding: 16, flexGrow: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FEF9FB' },
});