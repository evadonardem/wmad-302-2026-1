/**
 * Cooking Mode - Cookbook
 * Route: /cook/[id]?servings=4
 *
 * Full-screen, one step at a time with big text. Swipe or tap Next/Back.
 * Steps that mention a time get a big timer. The screen stays awake while
 * this mode is open, so it doesn't lock with messy hands.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator, Button, Modal, Portal, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { recipeApi } from '@/services/recipeApi';
import { Recipe } from '@/types/recipe';
import { useCookbook } from '@/context/CookbookContext';
import { useAllRecipes } from '@/hooks/useRecipes';
import { StepTimer } from '@/components/StepTimer';
import { fontFamily, makeStyles, radius, spacing, useAppTheme } from '@/constants/theme';
import { parseDurationMinutes, scaleIngredient } from '@/utils/ingredients';

export default function CookingModeScreen() {
  useKeepAwake();
  const styles = useStyles();
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ id: string; servings?: string }>();
  const recipeId = Number(params.id);
  const { byId } = useAllRecipes();
  const { markCooked } = useCookbook();

  const [recipe, setRecipe] = useState<Recipe | null>(byId.get(recipeId) ?? null);
  const [index, setIndex] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);
  const [finished, setFinished] = useState(false);
  const listRef = useRef<FlatList<string>>(null);

  useEffect(() => {
    if (!recipe && Number.isInteger(recipeId)) {
      recipeApi.getRecipeById(recipeId).then(setRecipe).catch(() => router.back());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId]);

  const servings = Number(params.servings) || recipe?.servings || 1;
  const ingredients = useMemo(
    () => (recipe ? recipe.ingredients.map((line) => scaleIngredient(line, servings / recipe.servings)) : []),
    [recipe, servings]
  );

  if (!recipe) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const steps = recipe.instructions;
  // The last page is the "All done" page
  const pages = [...steps, '__done__'];
  const isDonePage = index === steps.length;

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(pages.length - 1, next));
    listRef.current?.scrollToIndex({ index: clamped, animated: true });
    setIndex(clamped);
    Haptics.selectionAsync().catch(() => {});
  };

  const finish = () => {
    markCooked(recipe.id);
    setFinished(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()} accessibilityLabel="Close cooking mode">
          <MaterialCommunityIcons name="close" size={24} color={theme.colors.onSurface} />
        </Pressable>
        <Text style={styles.recipeName} numberOfLines={1}>
          {recipe.name}
        </Text>
        <Pressable style={styles.iconButton} onPress={() => setShowIngredients(true)} accessibilityLabel="Show ingredients">
          <MaterialCommunityIcons name="format-list-checks" size={24} color={theme.colors.onSurface} />
        </Pressable>
      </View>

      <View style={styles.progressWrap}>
        <ProgressBar progress={Math.min(1, (index + (isDonePage ? 0 : 1)) / steps.length)} color={theme.colors.primary} style={styles.progress} />
        <Text style={styles.progressText}>
          {isDonePage ? 'All steps done' : `Step ${index + 1} of ${steps.length}`}
        </Text>
      </View>

      {/* Steps: swipe left/right */}
      <FlatList
        ref={listRef}
        data={pages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item, index: pageIndex }) =>
          item === '__done__' ? (
            <View style={[styles.page, styles.center, { width }]}>
              <Text style={styles.doneEmoji}>{finished ? '🎉' : '🍽️'}</Text>
              <Text style={styles.doneTitle}>{finished ? 'Enjoy your meal!' : 'All done!'}</Text>
              <Text style={styles.doneText}>
                {finished
                  ? 'Saved to your cooking history.'
                  : 'Mark it as cooked to keep track of your cooking streak.'}
              </Text>
              {!finished ? (
                <Button mode="contained" icon="check" onPress={finish} style={styles.doneButton} contentStyle={styles.doneButtonContent}>
                  I cooked this
                </Button>
              ) : (
                <Button mode="contained" onPress={() => router.back()} style={styles.doneButton} contentStyle={styles.doneButtonContent}>
                  Back to recipe
                </Button>
              )}
            </View>
          ) : (
            <ScrollView style={{ width }} contentContainerStyle={styles.page}>
              <Text style={styles.stepNumber}>{pageIndex + 1}</Text>
              <Text style={styles.stepText}>{item}</Text>
              {(() => {
                const minutes = parseDurationMinutes(item);
                return minutes ? <StepTimer minutes={minutes} label={`Step ${pageIndex + 1}`} large /> : null;
              })()}
            </ScrollView>
          )
        }
      />

      {/* Back / Next */}
      <View style={styles.navRow}>
        <Button mode="outlined" icon="chevron-left" onPress={() => goTo(index - 1)} disabled={index === 0} style={styles.navButton} contentStyle={styles.navContent}>
          Back
        </Button>
        <Button
          mode="contained"
          icon={isDonePage ? undefined : 'chevron-right'}
          onPress={() => (isDonePage ? router.back() : goTo(index + 1))}
          style={styles.navButton}
          contentStyle={[styles.navContent, styles.navContentReverse]}
        >
          {isDonePage ? 'Close' : index === steps.length - 1 ? 'Finish' : 'Next'}
        </Button>
      </View>

      {/* Ingredients sheet */}
      <Portal>
        <Modal visible={showIngredients} onDismiss={() => setShowIngredients(false)} contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>Ingredients · {servings} servings</Text>
          <ScrollView>
            {ingredients.map((line, i) => (
              <View key={`${i}-${line}`} style={styles.modalRow}>
                <MaterialCommunityIcons name="circle-small" size={24} color={theme.colors.primary} />
                <Text style={styles.modalText}>{line}</Text>
              </View>
            ))}
          </ScrollView>
          <Button onPress={() => setShowIngredients(false)} style={styles.modalClose}>
            Close
          </Button>
        </Modal>
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
    center: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recipeName: {
      flex: 1,
      textAlign: 'center',
      fontFamily: fontFamily.displaySemi,
      fontSize: 17,
      color: c.onSurface,
    },
    progressWrap: {
      paddingHorizontal: spacing.lg,
    },
    progress: {
      height: 8,
      borderRadius: 4,
      backgroundColor: c.primaryContainer,
    },
    progressText: {
      fontFamily: fontFamily.semibold,
      fontSize: 13,
      color: c.muted,
      marginTop: 8,
    },
    page: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.lg,
    },
    stepNumber: {
      fontFamily: fontFamily.display,
      fontSize: 64,
      lineHeight: 70,
      color: c.primary,
      opacity: 0.35,
    },
    stepText: {
      fontFamily: fontFamily.medium,
      fontSize: 26,
      lineHeight: 38,
      color: c.onSurface,
      marginTop: spacing.sm,
    },
    doneEmoji: {
      fontSize: 72,
    },
    doneTitle: {
      fontFamily: fontFamily.display,
      fontSize: 32,
      color: c.onSurface,
      marginTop: spacing.md,
    },
    doneText: {
      fontFamily: fontFamily.regular,
      fontSize: 16,
      lineHeight: 24,
      color: c.muted,
      textAlign: 'center',
      marginTop: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    doneButton: {
      marginTop: spacing.lg,
      borderRadius: radius.pill,
    },
    doneButtonContent: {
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
    },
    navRow: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    navButton: {
      flex: 1,
      borderRadius: radius.pill,
    },
    navContent: {
      paddingVertical: 10,
    },
    navContentReverse: {
      flexDirection: 'row-reverse',
    },
    modal: {
      margin: spacing.md,
      padding: spacing.lg,
      maxHeight: '80%',
      borderRadius: radius.lg,
      backgroundColor: c.surface,
    },
    modalTitle: {
      fontFamily: fontFamily.display,
      fontSize: 22,
      color: c.onSurface,
      marginBottom: spacing.md,
    },
    modalRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 6,
    },
    modalText: {
      flex: 1,
      fontFamily: fontFamily.regular,
      fontSize: 16,
      lineHeight: 24,
      color: c.onSurface,
    },
    modalClose: {
      marginTop: spacing.sm,
    },
  })
);
