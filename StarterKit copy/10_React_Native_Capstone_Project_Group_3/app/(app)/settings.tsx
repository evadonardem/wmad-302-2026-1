/**
 * Settings Screen - appearance (light/dark, seasonal theme, lively background,
 * sounds), language and currency, security, notifications, data and app info.
 * Saved through SettingsContext.
 */
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Divider, List, SegmentedButtons, Snackbar, Switch } from 'react-native-paper';
import { useSettings } from '@/context/SettingsContext';
import { useWishlist } from '@/context/WishlistContext';
import { useActivity } from '@/context/ActivityContext';
import { useThemedStyles } from '@/hooks';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LivelyBackground } from '@/components/LivelyBackground';
import { SeasonPicker } from '@/components/SeasonPicker';
import { notificationsSupported, setDailyPromo } from '@/services/notifications';
import { biometricsAvailable } from '@/services/biometrics';
import { playSeasonSound } from '@/services/feedback';
import { LANGUAGE_NAMES } from '@/i18n/translations';
import type { Currency, Language, ThemeMode } from '@/types/account';
import { PHP_PER_USD } from '@/utils/format';
import { makeCommon } from '@/styles/common';
import { makeAccountStyles } from '@/styles/account';

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings, palette, season, isHoliday, t } = useSettings();
  const { items: wishlist, remove } = useWishlist();
  const { searchHistory, clearSearchHistory } = useActivity();
  const common = useThemedStyles(makeCommon);
  const styles = useThemedStyles(makeAccountStyles);
  const [confirmClear, setConfirmClear] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [canUseBiometrics, setCanUseBiometrics] = useState(false);
  const canNotify = notificationsSupported();

  useEffect(() => {
    biometricsAvailable().then(setCanUseBiometrics);
  }, []);

  const togglePromos = async (enabled: boolean) => {
    updateSettings({ promoNotifications: enabled });
    const ok = await setDailyPromo(enabled, isHoliday);
    if (enabled && !ok) {
      updateSettings({ promoNotifications: false });
      setSnackbar('Notification permission was denied');
    }
  };

  return (
    <View style={common.screen}>
      <LivelyBackground />
      <ScrollView contentContainerStyle={common.scrollContent}>
        <Text style={styles.groupTitle}>{t('settings.appearance')}</Text>
        <Card style={common.card} elevation={1}>
          <View style={styles.settingBlock}>
            <Text style={styles.settingLabel}>{t('settings.theme')}</Text>
            <SegmentedButtons
              value={settings.themeMode}
              onValueChange={(value) => updateSettings({ themeMode: value as ThemeMode })}
              buttons={[
                { value: 'system', label: t('settings.theme.system'), icon: 'theme-light-dark' },
                { value: 'light', label: t('settings.theme.light'), icon: 'white-balance-sunny' },
                { value: 'dark', label: t('settings.theme.dark'), icon: 'weather-night' },
              ]}
            />
          </View>
          <Divider />
          <View style={styles.settingBlock}>
            <Text style={styles.settingLabel}>{t('settings.season')}</Text>
            <SeasonPicker />
            <Text style={styles.settingHint}>{t('settings.seasonHint')}</Text>
          </View>
          <Divider />
          <List.Item
            title={t('settings.livelyBg')}
            description={t('settings.livelyBgDesc')}
            left={(props) => <List.Icon {...props} icon="palette" color={palette.primary} />}
            right={() => (
              <Switch
                value={settings.livelyBackground}
                onValueChange={(value) => updateSettings({ livelyBackground: value })}
              />
            )}
          />
          <Divider />
          <List.Item
            title={t('settings.sounds')}
            description={t('settings.soundsDesc')}
            left={(props) => <List.Icon {...props} icon="music-note" color={palette.primary} />}
            right={() => (
              <Switch
                value={settings.sounds}
                onValueChange={(value) => {
                  updateSettings({ sounds: value });
                  if (value) playSeasonSound(season); // preview
                }}
              />
            )}
          />
          <Divider />
          <List.Item
            title={t('settings.replayOnboarding')}
            left={(props) => <List.Icon {...props} icon="play-circle-outline" color={palette.primary} />}
            onPress={() => router.push('/onboarding')}
          />
          <Divider />
          <View style={styles.settingBlock}>
            <Text style={styles.settingLabel}>{t('settings.language')}</Text>
            <SegmentedButtons
              value={settings.language}
              onValueChange={(value) => updateSettings({ language: value as Language })}
              buttons={(Object.keys(LANGUAGE_NAMES) as Language[]).map((code) => ({
                value: code,
                label: LANGUAGE_NAMES[code],
              }))}
            />
          </View>
          <Divider />
          <View style={styles.settingBlock}>
            <Text style={styles.settingLabel}>{t('settings.currency')}</Text>
            <SegmentedButtons
              value={settings.currency}
              onValueChange={(value) => updateSettings({ currency: value as Currency })}
              buttons={[
                { value: 'USD', label: '$ USD' },
                { value: 'PHP', label: '₱ PHP' },
              ]}
            />
            <Text style={styles.settingHint}>{t('settings.currencyHint', { rate: PHP_PER_USD })}</Text>
          </View>
        </Card>

        <Text style={styles.groupTitle}>{t('settings.security')}</Text>
        <Card style={common.card} elevation={1}>
          <List.Item
            title={t('settings.biometric')}
            description={canUseBiometrics ? t('settings.biometricDesc') : t('settings.biometricUnavailable')}
            disabled={!canUseBiometrics}
            left={(props) => <List.Icon {...props} icon="fingerprint" color={palette.primary} />}
            right={() => (
              <Switch
                value={settings.biometricCheckout && canUseBiometrics}
                disabled={!canUseBiometrics}
                onValueChange={(value) => updateSettings({ biometricCheckout: value })}
              />
            )}
          />
        </Card>

        <Text style={styles.groupTitle}>{t('settings.notifications')}</Text>
        <Card style={common.card} elevation={1}>
          <List.Item
            title={t('settings.orderUpdates')}
            description={canNotify ? t('settings.orderUpdatesDesc') : t('settings.notificationsWeb')}
            disabled={!canNotify}
            left={(props) => <List.Icon {...props} icon="package-variant" color={palette.primary} />}
            right={() => (
              <Switch
                value={settings.orderNotifications}
                disabled={!canNotify}
                onValueChange={(value) => updateSettings({ orderNotifications: value })}
              />
            )}
          />
          <Divider />
          <List.Item
            title={t('settings.promos')}
            description={canNotify ? t('settings.promosDesc') : t('settings.notificationsWeb')}
            disabled={!canNotify}
            left={(props) => <List.Icon {...props} icon="tag-outline" color={palette.primary} />}
            right={() => (
              <Switch value={settings.promoNotifications} disabled={!canNotify} onValueChange={togglePromos} />
            )}
          />
        </Card>

        <Text style={styles.groupTitle}>{t('settings.data')}</Text>
        <Card style={common.card} elevation={1}>
          <List.Item
            title={t('settings.clearWishlist')}
            description={`${wishlist.length} saved item${wishlist.length === 1 ? '' : 's'}`}
            disabled={wishlist.length === 0}
            onPress={() => setConfirmClear(true)}
            left={(props) => <List.Icon {...props} icon="heart-off-outline" color={palette.danger} />}
          />
          <Divider />
          <List.Item
            title={t('settings.clearHistory')}
            description={`${searchHistory.length} search${searchHistory.length === 1 ? '' : 'es'}`}
            disabled={searchHistory.length === 0}
            onPress={() => {
              clearSearchHistory();
              setSnackbar('Search history cleared');
            }}
            left={(props) => <List.Icon {...props} icon="history" color={palette.danger} />}
          />
        </Card>

        <Text style={styles.groupTitle}>{t('settings.about')}</Text>
        <Card style={common.card} elevation={1}>
          <List.Item
            title={t('settings.version')}
            description="Marketplace v1.0.0"
            left={(props) => <List.Icon {...props} icon="information-outline" color={palette.primary} />}
          />
          <Divider />
          <List.Item
            title={t('settings.dataSource')}
            description="dummyjson.com"
            left={(props) => <List.Icon {...props} icon="database-outline" color={palette.primary} />}
          />
        </Card>
      </ScrollView>

      <ConfirmDialog
        visible={confirmClear}
        title={t('settings.clearWishlist')}
        message="Remove all saved items from your wishlist?"
        confirmLabel={t('common.clear')}
        destructive
        onConfirm={() => {
          wishlist.forEach((item) => remove(item.id));
          setConfirmClear(false);
          setSnackbar('Wishlist cleared');
        }}
        onDismiss={() => setConfirmClear(false)}
      />
      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={2000}>
        {snackbar}
      </Snackbar>
    </View>
  );
}
