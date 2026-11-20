/**
 * Collections - Cookbook
 * Route: /collections
 *
 * Your own recipe folders like "Date night" or "Meal prep".
 * Add recipes from a recipe's detail screen ("Collection" button).
 */
import React, { useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Button, Dialog, FAB, Portal, TextInput } from 'react-native-paper';
import { useCookbook } from '@/context/CookbookContext';
import { useAllRecipes } from '@/hooks/useRecipes';
import { EmptyState } from '@/components/CommonComponents';
import { fontFamily, makeStyles, radius, spacing } from '@/constants/theme';

const SUGGESTIONS = ['Date night', 'Meal prep', 'Party food', 'Weeknight dinners'];

export default function CollectionsScreen() {
  const styles = useStyles();
  const router = useRouter();
  const { collections, createCollection } = useCookbook();
  const { pick } = useAllRecipes();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const create = (value: string) => {
    if (!value.trim()) return;
    const id = createCollection(value);
    setCreating(false);
    setName('');
    router.push(`/collection/${id}`);
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title: 'Collections' }} />

      {collections.length === 0 ? (
        <View style={styles.flex}>
          <EmptyState
            emoji="📚"
            title="No collections yet"
            message="Group recipes into your own folders. Start with one of these:"
          />
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((suggestion) => (
              <Pressable key={suggestion} style={styles.suggestion} onPress={() => create(suggestion)}>
                <Text style={styles.suggestionText}>+ {suggestion}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={collections}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columns}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const covers = pick(item.recipeIds).slice(0, 4);
            return (
              <Pressable style={styles.card} onPress={() => router.push(`/collection/${item.id}`)}>
                <View style={styles.mosaic}>
                  {covers.length === 0 ? (
                    <View style={[styles.mosaicEmpty]}>
                      <Text style={styles.mosaicEmoji}>🍽️</Text>
                    </View>
                  ) : (
                    covers.map((recipe) => (
                      <Image
                        key={recipe.id}
                        source={{ uri: recipe.image }}
                        style={covers.length === 1 ? styles.mosaicFull : styles.mosaicQuarter}
                      />
                    ))
                  )}
                </View>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.cardCount}>
                  {item.recipeIds.length} recipe{item.recipeIds.length === 1 ? '' : 's'}
                </Text>
              </Pressable>
            );
          }}
        />
      )}

      <FAB icon="plus" label="New collection" style={styles.fab} onPress={() => setCreating(true)} />

      <Portal>
        <Dialog visible={creating} onDismiss={() => setCreating(false)}>
          <Dialog.Title>New collection</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label="Name"
              placeholder="e.g. Sunday brunch"
              value={name}
              onChangeText={setName}
              onSubmitEditing={() => create(name)}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreating(false)}>Cancel</Button>
            <Button onPress={() => create(name)} disabled={!name.trim()}>
              Create
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    flex: {
      flex: 1,
    },
    suggestions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 10,
      paddingHorizontal: spacing.lg,
      paddingBottom: 120,
    },
    suggestion: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: radius.pill,
      backgroundColor: c.primaryContainer,
    },
    suggestionText: {
      fontFamily: fontFamily.semibold,
      fontSize: 14,
      color: c.onPrimaryContainer,
    },
    list: {
      padding: spacing.md,
      paddingBottom: 120,
    },
    columns: {
      gap: 14,
    },
    card: {
      flex: 1,
      marginBottom: 18,
    },
    mosaic: {
      aspectRatio: 1,
      borderRadius: radius.lg,
      overflow: 'hidden',
      flexDirection: 'row',
      flexWrap: 'wrap',
      backgroundColor: c.surfaceVariant,
    },
    mosaicFull: {
      width: '100%',
      height: '100%',
    },
    mosaicQuarter: {
      width: '50%',
      height: '50%',
    },
    mosaicEmpty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mosaicEmoji: {
      fontSize: 40,
    },
    cardTitle: {
      fontFamily: fontFamily.display,
      fontSize: 17,
      color: c.onSurface,
      marginTop: 8,
    },
    cardCount: {
      fontFamily: fontFamily.regular,
      fontSize: 13,
      color: c.muted,
    },
    fab: {
      position: 'absolute',
      right: spacing.md,
      bottom: spacing.lg,
    },
  })
);
