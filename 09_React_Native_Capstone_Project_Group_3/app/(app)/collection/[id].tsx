/**
 * Collection Detail - Cookbook
 * Route: /collection/[id]
 *
 * The recipes in one collection. Rename or delete the collection,
 * or remove recipes from it.
 */
import React, { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Dialog, IconButton, Menu, Portal, Text, TextInput } from 'react-native-paper';
import { useCookbook } from '@/context/CookbookContext';
import { useAllRecipes } from '@/hooks/useRecipes';
import { RecipeTile } from '@/components/RecipeTile';
import { EmptyState } from '@/components/CommonComponents';
import { makeStyles, spacing, useAppTheme } from '@/constants/theme';

export default function CollectionDetailScreen() {
  const styles = useStyles();
  const theme = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { collections, renameCollection, deleteCollection, toggleInCollection } = useCookbook();
  const { pick } = useAllRecipes();

  const collection = collections.find((c) => c.id === id);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<'rename' | 'delete' | null>(null);
  const [name, setName] = useState(collection?.name ?? '');

  if (!collection) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ headerShown: true, title: 'Collection' }} />
        <EmptyState
          emoji="🗂️"
          title="Collection not found"
          message="It may have been deleted."
          actionLabel="All collections"
          onAction={() => router.replace('/collections')}
        />
      </View>
    );
  }

  const recipes = pick(collection.recipeIds);

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: collection.name,
          headerRight: () => (
            <Menu
              visible={menuOpen}
              onDismiss={() => setMenuOpen(false)}
              anchor={<IconButton icon="dots-vertical" onPress={() => setMenuOpen(true)} accessibilityLabel="Collection options" />}
            >
              <Menu.Item
                leadingIcon="pencil"
                title="Rename"
                onPress={() => {
                  setMenuOpen(false);
                  setName(collection.name);
                  setDialog('rename');
                }}
              />
              <Menu.Item
                leadingIcon="delete-outline"
                title="Delete"
                onPress={() => {
                  setMenuOpen(false);
                  setDialog('delete');
                }}
              />
            </Menu>
          ),
        }}
      />

      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={recipes.length === 0 ? styles.emptyContent : styles.list}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <RecipeTile recipe={item} size="wide" onPress={() => router.push(`/recipe/${item.id}`)} />
            <Button
              compact
              icon="folder-remove-outline"
              textColor={theme.colors.muted}
              onPress={() => toggleInCollection(collection.id, item.id)}
              style={styles.removeButton}
            >
              Remove from collection
            </Button>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            emoji="🍳"
            title="Nothing here yet"
            message="Open any recipe and tap “Collection” to save it here."
            actionLabel="Browse recipes"
            onAction={() => router.push('/search')}
          />
        }
      />

      <Portal>
        <Dialog visible={dialog === 'rename'} onDismiss={() => setDialog(null)}>
          <Dialog.Title>Rename collection</Dialog.Title>
          <Dialog.Content>
            <TextInput mode="outlined" label="Name" value={name} onChangeText={setName} autoFocus />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialog(null)}>Cancel</Button>
            <Button
              disabled={!name.trim()}
              onPress={() => {
                renameCollection(collection.id, name);
                setDialog(null);
              }}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={dialog === 'delete'} onDismiss={() => setDialog(null)}>
          <Dialog.Title>Delete “{collection.name}”?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">The recipes stay in the app; only this folder is removed.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialog(null)}>Cancel</Button>
            <Button
              textColor={theme.colors.error}
              onPress={() => {
                setDialog(null);
                deleteCollection(collection.id);
                router.back();
              }}
            >
              Delete
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
    list: {
      padding: spacing.md,
      paddingBottom: 40,
    },
    emptyContent: {
      flexGrow: 1,
    },
    item: {
      marginBottom: spacing.md,
    },
    removeButton: {
      alignSelf: 'flex-end',
    },
  })
);
