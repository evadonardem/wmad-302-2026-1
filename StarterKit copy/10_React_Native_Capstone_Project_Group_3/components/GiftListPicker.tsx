/**
 * Dialogs for gift lists: create a list (name, emoji, budget) and pick which
 * lists a product belongs to (from the product page).
 */
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Button, Checkbox, Dialog, HelperText, Portal, TextInput } from 'react-native-paper';
import { useSettings } from '@/context/SettingsContext';
import { useGiftLists } from '@/context/GiftListsContext';
import { useThemedStyles } from '@/hooks';
import { PHP_PER_USD, getDisplayCurrency } from '@/utils/format';
import type { ProductSummary } from '@/types/product';
import { makeRewardsStyles } from '@/styles/rewards';

const LIST_EMOJI = ['🎁', '🎄', '💖', '👩', '👨', '👶', '🎂', '🎓', '🏠', '🎃'];

export function CreateGiftListDialog({
  visible,
  onDismiss,
  onCreated,
}: {
  visible: boolean;
  onDismiss: () => void;
  onCreated?: (listId: string) => void;
}) {
  const { palette, t } = useSettings();
  const { createList } = useGiftLists();
  const styles = useThemedStyles(makeRewardsStyles);
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [emoji, setEmoji] = useState(LIST_EMOJI[0]);
  const [error, setError] = useState<string | null>(null);
  const pesos = getDisplayCurrency() === 'PHP';

  const reset = () => {
    setName('');
    setBudget('');
    setEmoji(LIST_EMOJI[0]);
    setError(null);
  };

  const submit = () => {
    if (name.trim().length < 2) {
      setError(t('giftLists.nameError'));
      return;
    }
    const amount = budget.trim() ? Number(budget.replace(/,/g, '')) : 0;
    if (Number.isNaN(amount) || amount < 0) {
      setError(t('giftLists.budgetError'));
      return;
    }
    // Budgets are stored in USD like every other amount
    const list = createList(name, pesos ? amount / PHP_PER_USD : amount, emoji);
    onCreated?.(list.id);
    reset();
    onDismiss();
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={() => {
          reset();
          onDismiss();
        }}
      >
        <Dialog.Title>{t('giftLists.create')}</Dialog.Title>
        <Dialog.Content>
          <TextInput mode="outlined" label={t('giftLists.name')} value={name} onChangeText={setName} maxLength={40} />
          <View style={styles.emojiRow}>
            {LIST_EMOJI.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => setEmoji(option)}
                style={[styles.emojiOption, option === emoji && { borderColor: palette.primary }]}
                accessibilityRole="radio"
                accessibilityState={{ selected: option === emoji }}
              >
                <Text style={styles.emojiOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            mode="outlined"
            label={`${t('giftLists.budgetLabel')} (${pesos ? '₱' : '$'})`}
            value={budget}
            onChangeText={setBudget}
            keyboardType="decimal-pad"
          />
          {error && <HelperText type="error">{error}</HelperText>}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>{t('common.cancel')}</Button>
          <Button mode="contained" onPress={submit}>
            {t('giftLists.createShort')}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

export function GiftListPicker({
  product,
  visible,
  onDismiss,
}: {
  product: ProductSummary;
  visible: boolean;
  onDismiss: () => void;
}) {
  const { t } = useSettings();
  const { lists, toggleItem } = useGiftLists();
  const [creating, setCreating] = useState(false);

  return (
    <>
      <Portal>
        <Dialog visible={visible && !creating} onDismiss={onDismiss}>
          <Dialog.Title>{t('giftLists.addTo')}</Dialog.Title>
          <Dialog.Content>
            {lists.length === 0 && <Text>{t('giftLists.emptyMessage')}</Text>}
            {lists.map((list) => (
              <Checkbox.Item
                key={list.id}
                label={`${list.emoji} ${list.name}`}
                status={list.items.some((item) => item.id === product.id) ? 'checked' : 'unchecked'}
                onPress={() => toggleItem(list.id, product)}
                mode="android"
              />
            ))}
          </Dialog.Content>
          <Dialog.Actions>
            <Button icon="plus" onPress={() => setCreating(true)}>
              {t('giftLists.createShort')}
            </Button>
            <Button mode="contained" onPress={onDismiss}>
              {t('common.done')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <CreateGiftListDialog
        visible={visible && creating}
        onDismiss={() => setCreating(false)}
        onCreated={(listId) => toggleItem(listId, product)}
      />
    </>
  );
}
