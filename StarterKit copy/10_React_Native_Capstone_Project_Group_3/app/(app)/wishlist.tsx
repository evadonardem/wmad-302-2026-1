/**
 * Wishlist Screen - products saved for later
 */
import React, { useState } from 'react';
import { FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';
import { IconButton, Snackbar } from 'react-native-paper';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import { useGridColumns, useThemedStyles } from '@/hooks';
import { EmptyState, ProductCard } from '@/components/CommonComponents';
import { LivelyBackground } from '@/components/LivelyBackground';
import { makeCommon } from '@/styles/common';
import { makeAccountStyles } from '@/styles/account';

export default function WishlistScreen() {
  const router = useRouter();
  const { items, remove } = useWishlist();
  const { addItem } = useCart();
  const { palette, t } = useSettings();
  const common = useThemedStyles(makeCommon);
  const styles = useThemedStyles(makeAccountStyles);
  const { columns, itemWidth } = useGridColumns();
  const [snackbar, setSnackbar] = useState<string | null>(null);

  return (
    <View style={common.screen}>
      <LivelyBackground />
      <FlatList
        key={`grid-${columns}`}
        data={items}
        keyExtractor={(item) => item.id.toString()}
        numColumns={columns}
        columnWrapperStyle={common.gridRow}
        contentContainerStyle={items.length === 0 ? styles.emptyContent : styles.gridContent}
        renderItem={({ item }) => (
          <View style={{ width: itemWidth }}>
            <ProductCard
              product={item}
              onPress={() => router.push(`/product/${item.id}`)}
              onAddToCart={() => {
                addItem(item);
                setSnackbar(t('common.addedToCart', { title: item.title }));
              }}
            />
            <IconButton
              icon="heart"
              iconColor={palette.danger}
              mode="contained"
              containerColor={palette.surface}
              size={18}
              style={styles.wishlistRemove}
              onPress={() => remove(item.id)}
              accessibilityLabel={`Remove ${item.title} from wishlist`}
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            title="Your wishlist is empty"
            message="Tap the heart on any product to save it for later."
            actionLabel={t('cart.continue')}
            onAction={() => router.replace('/home')}
          />
        }
      />
      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar(null)}
        duration={2500}
        action={{ label: t('common.viewCart'), onPress: () => router.push('/cart') }}
      >
        {snackbar}
      </Snackbar>
    </View>
  );
}
