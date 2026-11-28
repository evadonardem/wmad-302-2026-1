/**
 * Cart Screen - Marketplace
 * Cart state lives in CartContext (useReducer + AsyncStorage persistence).
 * Quantity updates, removal, coupons and the order summary; checkout continues
 * on the Checkout screen (POST /carts/add).
 */
import React, { useState } from 'react';
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SEASONS } from '@/constants/seasons';
import { Button, Card, Divider, HelperText, IconButton, Snackbar, TextInput } from 'react-native-paper';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import { useRewards } from '@/context/RewardsContext';
import { buildSharedListUrl, shareLink } from '@/services/share';
import { useThemedStyles } from '@/hooks';
import { EmptyState, QuantitySelector } from '@/components/CommonComponents';
import { SeasonSpinner } from '@/components/SeasonSpinner';
import { LivelyBackground } from '@/components/LivelyBackground';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { COUPONS, FREE_SHIPPING_THRESHOLD } from '@/utils/cart';
import { formatPrice, getDiscountedPrice } from '@/utils/format';
import type { CartItem } from '@/types/product';
import { makeCommon } from '@/styles/common';
import { makeCartStyles } from '@/styles/cart';

export default function CartScreen() {
  const router = useRouter();
  const { items, hydrated, totals, couponCode, updateQuantity, removeItem, applyCoupon, removeCoupon, clearCart } =
    useCart();
  const { palette, season, isHoliday, heading, t } = useSettings();
  const { rewards } = useRewards();
  const common = useThemedStyles(makeCommon);
  const styles = useThemedStyles(makeCartStyles);

  const [pendingRemoval, setPendingRemoval] = useState<CartItem | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    const error = applyCoupon(couponInput, rewards.unlockedCoupons);
    setCouponError(error);
    if (!error) setCouponInput('');
  };

  const shareCart = async () => {
    const url = buildSharedListUrl('cart', items.map((item) => ({ id: item.productId, quantity: item.quantity })));
    const outcome = await shareLink(t('cart.share'), t('cart.shareMessage', { count: totals.totalQuantity }), url);
    if (outcome === 'copied') setNotice(t('common.linkCopied'));
  };

  const confirmRemoval = () => {
    if (pendingRemoval) removeItem(pendingRemoval.productId);
    setPendingRemoval(null);
  };

  const renderItem = ({ item }: { item: CartItem }) => {
    const discountedPrice = getDiscountedPrice(item.price, item.discountPercentage);
    return (
      <View style={styles.cartItem}>
        <TouchableOpacity onPress={() => router.push(`/product/${item.productId}`)}>
          <Image source={{ uri: item.thumbnail }} style={styles.itemImage} resizeMode="contain" />
        </TouchableOpacity>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.itemPriceRow}>
            <Text style={styles.itemCurrentPrice}>{formatPrice(discountedPrice)}</Text>
            {item.discountPercentage > 0 && (
              <Text style={styles.itemOriginalPrice}>{formatPrice(item.price)}</Text>
            )}
          </View>
          <View style={common.rowBetween}>
            <QuantitySelector
              value={item.quantity}
              max={item.stock}
              onChange={(quantity) => updateQuantity(item.productId, quantity)}
            />
            <Text style={styles.lineTotal}>{formatPrice(discountedPrice * item.quantity)}</Text>
          </View>
          {item.quantity >= item.stock && <Text style={styles.stockNote}>Max stock reached</Text>}
        </View>
        <IconButton
          icon="delete-outline"
          size={22}
          iconColor={palette.danger}
          onPress={() => setPendingRemoval(item)}
          accessibilityLabel={`Remove ${item.title}`}
          style={styles.removeButton}
        />
      </View>
    );
  };

  if (!hydrated) {
    return (
      <View style={common.centered}>
        <SeasonSpinner size="large" />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={common.screen} edges={['top']}>
        <LivelyBackground />
        <EmptyState
          icon={isHoliday ? 'gift-open-outline' : 'cart-outline'}
          title={isHoliday ? t('cart.emptyTitleHoliday') : t('cart.emptyTitle')}
          message={t('cart.emptyMessage')}
          actionLabel={t('cart.continue')}
          onAction={() => router.push('/home')}
        />
      </SafeAreaView>
    );
  }

  const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - totals.discountedSubtotal;
  const couponHint = COUPONS.filter(
    (c) => (isHoliday || c.code !== 'XMAS25') && (!c.rewardOnly || rewards.unlockedCoupons.includes(c.code))
  )
    .map((c) => c.code)
    .join(', ');

  const summary = (
    <View>
      {/* Coupon */}
      <Card style={styles.couponCard} elevation={1}>
        <Card.Content>
          <Text style={styles.cardTitle}>{t('cart.coupon')}</Text>
          {couponCode ? (
            <View style={common.rowBetween}>
              <Text style={styles.appliedCoupon}>
                🎟️ {couponCode}
                {totals.couponDiscount === 0 ? ' (minimum not met)' : ''}
              </Text>
              <Button compact onPress={removeCoupon}>
                {t('common.remove')}
              </Button>
            </View>
          ) : (
            <>
              <View style={styles.couponRow}>
                <TextInput
                  mode="outlined"
                  dense
                  placeholder={t('cart.enterCode')}
                  value={couponInput}
                  onChangeText={(v) => {
                    setCouponInput(v);
                    setCouponError(null);
                  }}
                  autoCapitalize="characters"
                  style={styles.couponInput}
                  error={!!couponError}
                  onSubmitEditing={handleApplyCoupon}
                />
                <Button mode="contained-tonal" onPress={handleApplyCoupon} disabled={!couponInput.trim()}>
                  {t('cart.apply')}
                </Button>
              </View>
              <HelperText type={couponError ? 'error' : 'info'}>{couponError ?? `Try: ${couponHint}`}</HelperText>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Order Summary */}
      <View style={styles.summaryContainer}>
        <View style={common.summaryRow}>
          <Text style={common.summaryLabel}>{t('cart.subtotal', { count: totals.totalQuantity })}</Text>
          <Text style={common.summaryValue}>{formatPrice(totals.subtotal)}</Text>
        </View>
        {totals.productDiscount > 0 && (
          <View style={common.summaryRow}>
            <Text style={common.summaryLabel}>{t('cart.productDiscounts')}</Text>
            <Text style={common.summaryDiscount}>-{formatPrice(totals.productDiscount)}</Text>
          </View>
        )}
        {totals.couponDiscount > 0 && (
          <View style={common.summaryRow}>
            <Text style={common.summaryLabel}>
              {t('cart.coupon')} ({couponCode})
            </Text>
            <Text style={common.summaryDiscount}>-{formatPrice(totals.couponDiscount)}</Text>
          </View>
        )}
        <View style={common.summaryRow}>
          <Text style={common.summaryLabel}>{t('cart.shipping')}</Text>
          <Text style={common.summaryValue}>
            {totals.shippingFee === 0 ? t('cart.free') : formatPrice(totals.shippingFee)}
          </Text>
        </View>
        {amountToFreeShipping > 0 && (
          <Text style={styles.shippingHint}>
            {t('cart.freeShippingHint', { amount: formatPrice(amountToFreeShipping) })}
          </Text>
        )}
        <Divider style={common.divider} />
        <View style={common.rowBetween}>
          <Text style={common.summaryTotalLabel}>{t('cart.total')}</Text>
          <Text style={common.summaryTotalValue}>{formatPrice(totals.grandTotal)}</Text>
        </View>
        <Button
          mode="contained"
          icon="lock-outline"
          onPress={() => router.push('/checkout')}
          style={styles.checkoutButton}
          contentStyle={common.buttonContent}
        >
          {t('cart.checkout')}
        </Button>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={common.screen} edges={['top']}>
      <LivelyBackground />
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.productId.toString()}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={[common.rowBetween, styles.header]}>
            <Text style={[styles.headerTitle, heading(24)]} numberOfLines={1}>
              {SEASONS[season].emoji} {t('cart.title', { count: totals.totalQuantity })}
            </Text>
            <IconButton
              icon="share-variant"
              iconColor={palette.primary}
              onPress={shareCart}
              accessibilityLabel={t('cart.share')}
            />
            <Button compact textColor={palette.danger} onPress={() => setConfirmClear(true)}>
              {t('common.clear')}
            </Button>
          </View>
        }
        ListFooterComponent={summary}
      />

      <ConfirmDialog
        visible={!!pendingRemoval}
        title={t('cart.removeTitle')}
        message={`Remove "${pendingRemoval?.title ?? ''}" from your cart?`}
        confirmLabel={t('common.remove')}
        destructive
        onConfirm={confirmRemoval}
        onDismiss={() => setPendingRemoval(null)}
      />
      <ConfirmDialog
        visible={confirmClear}
        title={t('cart.clearTitle')}
        message={t('cart.clearMessage')}
        confirmLabel={t('cart.clearTitle')}
        destructive
        onConfirm={() => {
          clearCart();
          setConfirmClear(false);
        }}
        onDismiss={() => setConfirmClear(false)}
      />
      <Snackbar visible={!!notice} onDismiss={() => setNotice(null)} duration={2000}>
        {notice}
      </Snackbar>
    </SafeAreaView>
  );
}
