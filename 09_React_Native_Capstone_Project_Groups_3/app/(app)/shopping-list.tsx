/**
 * Shopping List - Cookbook
 * Route: /shopping-list
 *
 * Ingredients added from recipes (or typed in by hand). The same ingredient
 * from different recipes is merged into one row. Tick items off in the store.
 */
import React, { useMemo, useState } from 'react';
import { Pressable, SectionList, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Button, Dialog, IconButton, Portal, Text as PaperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCookbook } from '@/context/CookbookContext';
import { useAllRecipes } from '@/hooks/useRecipes';
import { EmptyState } from '@/components/CommonComponents';
import { ShoppingItem } from '@/types/cookbook';
import { fontFamily, makeStyles, radius, spacing, useAppTheme } from '@/constants/theme';

export default function ShoppingListScreen() {
  const styles = useStyles();
  const theme = useAppTheme();
  const router = useRouter();
  const { shopping, addToShoppingList, toggleShoppingItem, removeShoppingItem, clearCheckedShopping, clearShopping } =
    useCookbook();
  const { byId } = useAllRecipes();
  const [newItem, setNewItem] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const sections = useMemo(() => {
    const toBuy = shopping.filter((item) => !item.checked);
    const inCart = shopping.filter((item) => item.checked);
    return [
      { title: `To buy (${toBuy.length})`, data: toBuy },
      ...(inCart.length ? [{ title: `In the cart (${inCart.length})`, data: inCart }] : []),
    ];
  }, [shopping]);

  const addItem = () => {
    if (!newItem.trim()) return;
    addToShoppingList([newItem.trim()]);
    setNewItem('');
  };

  const toggle = (id: string) => {
    toggleShoppingItem(id);
    Haptics.selectionAsync().catch(() => {});
  };

  const shareList = () => {
    const toBuy = shopping.filter((item) => !item.checked);
    const text = ['🛒 Shopping list', '', ...toBuy.map((item) => `☐ ${item.details.join(' + ')}`)].join('\n');
    Share.share({ message: text }).catch(() => {});
  };

  const renderItem = ({ item }: { item: ShoppingItem }) => {
    const sources = item.recipeIds.map((id) => byId.get(id)?.name).filter(Boolean);
    const showDetails = item.details.length > 1 || item.details[0]?.toLowerCase() !== item.key;
    return (
      <Pressable
        style={styles.row}
        onPress={() => toggle(item.id)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.checked }}
      >
        <MaterialCommunityIcons
          name={item.checked ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
          size={26}
          color={item.checked ? theme.colors.primary : theme.colors.outline}
        />
        <View style={styles.rowText}>
          <Text style={[styles.itemName, item.checked && styles.itemChecked]}>{item.name}</Text>
          {showDetails && (
            <Text style={styles.itemDetails} numberOfLines={2}>
              {item.details.join('  ·  ')}
            </Text>
          )}
          {sources.length > 0 && (
            <Text style={styles.itemSource} numberOfLines={1}>
              For {sources.join(', ')}
            </Text>
          )}
        </View>
        <IconButton icon="close" size={18} onPress={() => removeShoppingItem(item.id)} accessibilityLabel={`Remove ${item.name}`} />
      </Pressable>
    );
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Shopping list',
          headerRight: () =>
            shopping.length > 0 ? (
              <IconButton icon="share-variant" onPress={shareList} accessibilityLabel="Share shopping list" />
            ) : null,
        }}
      />

      {/* Add your own item */}
      <View style={styles.addRow}>
        <MaterialCommunityIcons name="plus" size={22} color={theme.colors.primary} />
        <TextInput
          placeholder="Add an item, e.g. 2 lemons"
          placeholderTextColor={theme.colors.muted}
          value={newItem}
          onChangeText={setNewItem}
          onSubmitEditing={addItem}
          returnKeyType="done"
          style={styles.addInput}
        />
        {newItem.trim() ? (
          <Button compact onPress={addItem}>
            Add
          </Button>
        ) : null}
      </View>

      {shopping.length === 0 ? (
        <EmptyState
          emoji="🛒"
          title="Your list is empty"
          message="Open a recipe and tap “Shopping list” to add its ingredients, or type an item above."
          actionLabel="Find a recipe"
          onAction={() => router.push('/search')}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          ListFooterComponent={
            <View style={styles.footer}>
              <Button mode="outlined" onPress={clearCheckedShopping} disabled={!shopping.some((i) => i.checked)} style={styles.footerButton}>
                Clear ticked items
              </Button>
              <Button textColor={theme.colors.error} onPress={() => setConfirmClear(true)}>
                Clear whole list
              </Button>
            </View>
          }
        />
      )}

      <Portal>
        <Dialog visible={confirmClear} onDismiss={() => setConfirmClear(false)}>
          <Dialog.Title>Clear shopping list?</Dialog.Title>
          <Dialog.Content>
            <PaperText variant="bodyMedium">This removes every item from your list.</PaperText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmClear(false)}>Cancel</Button>
            <Button
              textColor={theme.colors.error}
              onPress={() => {
                clearShopping();
                setConfirmClear(false);
              }}
            >
              Clear
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
    addRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      margin: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      elevation: 1,
    },
    addInput: {
      flex: 1,
      fontFamily: fontFamily.regular,
      fontSize: 15,
      color: c.onSurface,
      paddingVertical: 10,
    },
    list: {
      paddingHorizontal: spacing.md,
      paddingBottom: 40,
    },
    sectionHeader: {
      fontFamily: fontFamily.display,
      fontSize: 19,
      color: c.onSurface,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingLeft: spacing.md,
      paddingVertical: 6,
      marginBottom: 8,
      borderRadius: radius.md,
      backgroundColor: c.surface,
    },
    rowText: {
      flex: 1,
      paddingVertical: 6,
    },
    itemName: {
      fontFamily: fontFamily.semibold,
      fontSize: 16,
      color: c.onSurface,
    },
    itemChecked: {
      color: c.muted,
      textDecorationLine: 'line-through',
    },
    itemDetails: {
      fontFamily: fontFamily.regular,
      fontSize: 13,
      color: c.onSurfaceVariant,
      marginTop: 2,
    },
    itemSource: {
      fontFamily: fontFamily.regular,
      fontSize: 12,
      color: c.muted,
      marginTop: 2,
    },
    footer: {
      marginTop: spacing.lg,
      gap: 8,
    },
    footerButton: {
      borderRadius: radius.pill,
    },
  })
);
