/**
 * Gift Lists Screen - named lists ("For Mom", "Secret Santa") with a budget
 * progress bar. Lists can be shared as a link and items opened or removed.
 */
import React, { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, IconButton, Snackbar } from 'react-native-paper';
import { useSettings } from '@/context/SettingsContext';
import { giftListTotal, GiftList, useGiftLists } from '@/context/GiftListsContext';
import { useThemedStyles } from '@/hooks';
import { EmptyState } from '@/components/CommonComponents';
import { LivelyBackground } from '@/components/LivelyBackground';
import { GlassCard } from '@/components/GlassCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { CreateGiftListDialog } from '@/components/GiftListPicker';
import { buildSharedListUrl, shareLink } from '@/services/share';
import { formatPrice, getDiscountedPrice } from '@/utils/format';
import { makeCommon } from '@/styles/common';
import { makeRewardsStyles } from '@/styles/rewards';

export default function GiftListsScreen() {
  const router = useRouter();
  const { palette, heading, t } = useSettings();
  const { lists, deleteList, toggleItem } = useGiftLists();
  const common = useThemedStyles(makeCommon);
  const styles = useThemedStyles(makeRewardsStyles);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<GiftList | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const share = async (list: GiftList) => {
    const url = buildSharedListUrl('list', list.items.map((item) => ({ id: item.id, quantity: 1 })), `${list.emoji} ${list.name}`);
    const outcome = await shareLink(list.name, t('giftLists.shareMessage', { name: list.name }), url);
    if (outcome === 'copied') setSnackbar(t('common.linkCopied'));
  };

  return (
    <View style={common.screen}>
      <LivelyBackground />
      {lists.length === 0 ? (
        <EmptyState
          icon="gift-outline"
          title={t('giftLists.emptyTitle')}
          message={t('giftLists.emptyMessage')}
          actionLabel={t('giftLists.create')}
          onAction={() => setCreating(true)}
        />
      ) : (
        <ScrollView contentContainerStyle={common.scrollContent}>
          <Button mode="contained" icon="plus" onPress={() => setCreating(true)} style={{ marginBottom: 16 }}>
            {t('giftLists.create')}
          </Button>
          {lists.map((list) => {
            const total = giftListTotal(list);
            const ratio = list.budget > 0 ? Math.min(total / list.budget, 1) : 0;
            const over = list.budget > 0 && total > list.budget;
            return (
              <GlassCard key={list.id}>
                <View style={styles.listHeader}>
                  <Text style={styles.listEmoji}>{list.emoji}</Text>
                  <View style={styles.flex}>
                    <Text style={[styles.listName, heading(22)]} numberOfLines={1}>
                      {list.name}
                    </Text>
                    <Text style={[styles.listMeta, over && { color: palette.danger }]}>
                      {list.budget > 0
                        ? t('giftLists.budget', { spent: formatPrice(total), budget: formatPrice(list.budget) })
                        : t('giftLists.noBudget', { count: list.items.length, spent: formatPrice(total) })}
                    </Text>
                  </View>
                  <IconButton
                    icon="share-variant"
                    disabled={list.items.length === 0}
                    onPress={() => share(list)}
                    accessibilityLabel={`Share ${list.name}`}
                  />
                  <IconButton
                    icon="delete-outline"
                    iconColor={palette.danger}
                    onPress={() => setPendingDelete(list)}
                    accessibilityLabel={`Delete ${list.name}`}
                  />
                </View>
                {list.budget > 0 && (
                  <View style={styles.progressTrack} accessibilityLabel={`${Math.round(ratio * 100)}% of budget`}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${ratio * 100}%`, backgroundColor: over ? palette.danger : palette.primary },
                      ]}
                    />
                  </View>
                )}
                {list.items.length === 0 ? (
                  <Text style={[common.muted, { marginTop: 10 }]}>{t('giftLists.noItems')}</Text>
                ) : (
                  list.items.map((item) => (
                    <View key={item.id} style={styles.listItem}>
                      <TouchableOpacity onPress={() => router.push(`/product/${item.id}`)} style={[styles.flex, common.row]}>
                        <Image source={{ uri: item.thumbnail }} style={styles.listItemImage} resizeMode="contain" />
                        <View style={[styles.flex, { marginLeft: 10 }]}>
                          <Text style={styles.listItemTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={styles.listItemPrice}>
                            {formatPrice(getDiscountedPrice(item.price, item.discountPercentage))}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      <IconButton
                        icon="close"
                        size={18}
                        onPress={() => toggleItem(list.id, item)}
                        accessibilityLabel={`Remove ${item.title}`}
                      />
                    </View>
                  ))
                )}
              </GlassCard>
            );
          })}
        </ScrollView>
      )}

      <CreateGiftListDialog visible={creating} onDismiss={() => setCreating(false)} />
      <ConfirmDialog
        visible={!!pendingDelete}
        title={t('giftLists.delete')}
        message={t('giftLists.deleteMessage', { name: pendingDelete?.name ?? '' })}
        confirmLabel={t('common.remove')}
        destructive
        onConfirm={() => {
          if (pendingDelete) deleteList(pendingDelete.id);
          setPendingDelete(null);
        }}
        onDismiss={() => setPendingDelete(null)}
      />
      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={2000}>
        {snackbar}
      </Snackbar>
    </View>
  );
}
