/**
 * Weekly Meal Planner - Cookbook
 * Route: /meal-plan
 *
 * Add recipes to Monday-Sunday (tap "+ Add" on a day and pick a recipe),
 * then turn the whole week into one shopping list.
 */
import React, { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Button, Dialog, IconButton, Modal, Portal, Searchbar, Snackbar, Text as PaperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DAYS, useCookbook } from '@/context/CookbookContext';
import { useAllRecipes } from '@/hooks/useRecipes';
import { DayKey } from '@/types/cookbook';
import { Recipe } from '@/types/recipe';
import { fontFamily, makeStyles, radius, spacing, useAppTheme } from '@/constants/theme';

/** Monday = 0 ... Sunday = 6 */
const todayIndex = () => (new Date().getDay() + 6) % 7;

export default function MealPlanScreen() {
  const styles = useStyles();
  const theme = useAppTheme();
  const router = useRouter();
  const { mealPlan, addToPlan, removeFromPlan, clearPlan, addToShoppingList, favorites } = useCookbook();
  const { recipes, byId, pick } = useAllRecipes();

  const [pickerDay, setPickerDay] = useState<DayKey | null>(null);
  const [query, setQuery] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const plannedIds = useMemo(() => DAYS.flatMap((day) => mealPlan[day.key]), [mealPlan]);

  // Picker list: favorites first, then everything else, filtered by the search box
  const pickerRecipes = useMemo(() => {
    const q = query.trim().toLowerCase();
    const favoriteSet = new Set(favorites);
    return [...recipes]
      .filter((r) => !q || r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q))
      .sort((a, b) => Number(favoriteSet.has(b.id)) - Number(favoriteSet.has(a.id)));
  }, [recipes, favorites, query]);

  const choose = (recipe: Recipe) => {
    if (!pickerDay) return;
    addToPlan(pickerDay, recipe.id);
    setPickerDay(null);
    setQuery('');
  };

  const weekToShoppingList = () => {
    let count = 0;
    plannedIds.forEach((id) => {
      const recipe = byId.get(id);
      if (recipe) {
        addToShoppingList(recipe.ingredients, recipe.id);
        count += recipe.ingredients.length;
      }
    });
    setMessage(`Added ${count} ingredients from ${plannedIds.length} meals`);
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title: 'Meal planner' }} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          {plannedIds.length === 0
            ? 'Plan your week: tap “Add” on any day to pick a recipe.'
            : `${plannedIds.length} meal${plannedIds.length === 1 ? '' : 's'} planned this week`}
        </Text>

        {DAYS.map((day, i) => {
          const dayRecipes = pick(mealPlan[day.key]);
          const isToday = i === todayIndex();
          return (
            <View key={day.key} style={[styles.dayCard, isToday && styles.dayCardToday]}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>
                  {day.label}
                  {isToday ? <Text style={styles.todayTag}>  · Today</Text> : null}
                </Text>
                <Button compact icon="plus" onPress={() => setPickerDay(day.key)}>
                  Add
                </Button>
              </View>
              {dayRecipes.length === 0 ? (
                <Text style={styles.emptyDay}>Nothing planned</Text>
              ) : (
                dayRecipes.map((recipe) => (
                  <Pressable key={recipe.id} style={styles.mealRow} onPress={() => router.push(`/recipe/${recipe.id}`)}>
                    <Image source={{ uri: recipe.image }} style={styles.thumb} />
                    <View style={styles.mealText}>
                      <Text style={styles.mealName} numberOfLines={1}>
                        {recipe.name}
                      </Text>
                      <Text style={styles.mealMeta}>
                        {recipe.prepTimeMinutes + recipe.cookTimeMinutes} min · {recipe.caloriesPerServing} kcal
                      </Text>
                    </View>
                    <IconButton
                      icon="close"
                      size={18}
                      onPress={() => removeFromPlan(day.key, recipe.id)}
                      accessibilityLabel={`Remove ${recipe.name} from ${day.label}`}
                    />
                  </Pressable>
                ))
              )}
            </View>
          );
        })}

        <Button
          mode="contained"
          icon="cart-arrow-down"
          onPress={weekToShoppingList}
          disabled={plannedIds.length === 0}
          style={styles.mainButton}
          contentStyle={styles.mainButtonContent}
        >
          Make shopping list for the week
        </Button>
        {plannedIds.length > 0 && (
          <Button textColor={theme.colors.error} onPress={() => setConfirmClear(true)}>
            Clear the week
          </Button>
        )}
      </ScrollView>

      <Portal>
        {/* Recipe picker */}
        <Modal visible={pickerDay !== null} onDismiss={() => setPickerDay(null)} contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>
            Add to {DAYS.find((d) => d.key === pickerDay)?.label ?? ''}
          </Text>
          <Searchbar placeholder="Search recipes" value={query} onChangeText={setQuery} style={styles.modalSearch} />
          <FlatList
            data={pickerRecipes}
            keyExtractor={(item) => item.id.toString()}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable style={styles.pickRow} onPress={() => choose(item)}>
                <Image source={{ uri: item.image }} style={styles.thumbSmall} />
                <Text style={styles.pickName} numberOfLines={1}>
                  {item.name}
                </Text>
                {favorites.includes(item.id) && (
                  <MaterialCommunityIcons name="heart" size={16} color={theme.colors.error} />
                )}
              </Pressable>
            )}
          />
        </Modal>

        <Dialog visible={confirmClear} onDismiss={() => setConfirmClear(false)}>
          <Dialog.Title>Clear the week?</Dialog.Title>
          <Dialog.Content>
            <PaperText variant="bodyMedium">This removes every planned meal.</PaperText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmClear(false)}>Cancel</Button>
            <Button
              textColor={theme.colors.error}
              onPress={() => {
                clearPlan();
                setConfirmClear(false);
              }}
            >
              Clear
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={message !== null}
        onDismiss={() => setMessage(null)}
        duration={2500}
        action={{ label: 'View', onPress: () => router.push('/shopping-list') }}
      >
        {message ?? ''}
      </Snackbar>
    </View>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      padding: spacing.md,
      paddingBottom: 48,
    },
    intro: {
      fontFamily: fontFamily.regular,
      fontSize: 14,
      color: c.muted,
      marginBottom: spacing.md,
    },
    dayCard: {
      padding: spacing.md,
      paddingRight: spacing.sm,
      marginBottom: 12,
      borderRadius: radius.lg,
      backgroundColor: c.surface,
    },
    dayCardToday: {
      borderWidth: 2,
      borderColor: c.primary,
    },
    dayHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dayName: {
      fontFamily: fontFamily.display,
      fontSize: 19,
      color: c.onSurface,
    },
    todayTag: {
      fontFamily: fontFamily.semibold,
      fontSize: 13,
      color: c.primary,
    },
    emptyDay: {
      fontFamily: fontFamily.regular,
      fontSize: 13,
      color: c.muted,
      marginTop: 2,
    },
    mealRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 10,
    },
    thumb: {
      width: 52,
      height: 52,
      borderRadius: radius.sm,
    },
    mealText: {
      flex: 1,
    },
    mealName: {
      fontFamily: fontFamily.semibold,
      fontSize: 15,
      color: c.onSurface,
    },
    mealMeta: {
      fontFamily: fontFamily.regular,
      fontSize: 12,
      color: c.muted,
      marginTop: 2,
    },
    mainButton: {
      marginTop: spacing.md,
      borderRadius: radius.pill,
    },
    mainButtonContent: {
      paddingVertical: 8,
    },
    modal: {
      margin: spacing.md,
      padding: spacing.md,
      height: '80%',
      borderRadius: radius.lg,
      backgroundColor: c.surface,
    },
    modalTitle: {
      fontFamily: fontFamily.display,
      fontSize: 22,
      color: c.onSurface,
      marginBottom: spacing.sm,
    },
    modalSearch: {
      marginBottom: spacing.sm,
    },
    pickRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 8,
    },
    thumbSmall: {
      width: 44,
      height: 44,
      borderRadius: radius.sm,
    },
    pickName: {
      flex: 1,
      fontFamily: fontFamily.medium,
      fontSize: 15,
      color: c.onSurface,
    },
  })
);
