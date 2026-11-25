/**
 * A titled, horizontally scrolling row of recipe cards ("Top rated", "Desserts"...).
 * Shows shimmering placeholders while loading and hides itself when empty.
 */
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Recipe } from '@/types/recipe';
import { fontFamily, makeStyles, spacing } from '@/constants/theme';
import { RecipeTile } from './RecipeTile';
import { Skeleton } from './CommonComponents';

interface RecipeShelfProps {
  title: string;
  subtitle?: string;
  recipes: Recipe[];
  loading?: boolean;
  onSeeAll?: () => void;
}

export function RecipeShelf({ title, subtitle, recipes, loading = false, onSeeAll }: RecipeShelfProps) {
  const styles = useStyles();
  const router = useRouter();

  if (!loading && recipes.length === 0) return null;

  return (
    <View style={styles.shelf}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {onSeeAll && (
          <Pressable onPress={onSeeAll} hitSlop={8} accessibilityRole="button">
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.skeletonRow}>
          <Skeleton width={210} height={250} borderRadius={22} />
          <Skeleton width={210} height={250} borderRadius={22} />
        </View>
      ) : (
        <FlatList
          horizontal
          data={recipes}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ width: 14 }} />}
          renderItem={({ item }) => (
            <RecipeTile recipe={item} size="shelf" onPress={() => router.push(`/recipe/${item.id}`)} />
          )}
        />
      )}
    </View>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    shelf: {
      marginBottom: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      marginBottom: 12,
    },
    headerText: {
      flex: 1,
    },
    title: {
      fontFamily: fontFamily.display,
      fontSize: 21,
      color: c.onSurface,
    },
    subtitle: {
      fontFamily: fontFamily.regular,
      fontSize: 13,
      color: c.muted,
      marginTop: 2,
    },
    seeAll: {
      fontFamily: fontFamily.semibold,
      fontSize: 14,
      color: c.primary,
    },
    list: {
      paddingHorizontal: spacing.md,
      paddingBottom: 6,
    },
    skeletonRow: {
      flexDirection: 'row',
      gap: 14,
      paddingHorizontal: spacing.md,
    },
  })
);
