/**
 * Settings Screen - persisted preferences and data management
 */
import React, { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { Button, Card, Dialog, List, Portal, SegmentedButtons, Switch } from 'react-native-paper';
import { useAsyncStorage } from '@/hooks';
import { useFavorites } from '@/context/FavoritesContext';
import { AppSettings, DEFAULT_SETTINGS, STORAGE_KEYS } from '@/utils/storage';
import { createStyles, tc, ThemeMode, useAppTheme } from '@/context/ThemeContext';

export default function SettingsScreen() {
    const { mode, setMode } = useAppTheme();
    const [settings, setSettings] = useAsyncStorage<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    const { count, clearFavorites } = useFavorites();
    const [confirmClear, setConfirmClear] = useState(false);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Card style={styles.card} elevation={1}>
                <List.Section>
                    <List.Subheader>Appearance</List.Subheader>
                    <SegmentedButtons
                        style={styles.segmented}
                        value={mode}
                        onValueChange={(value) => setMode(value as ThemeMode)}
                        buttons={[
                            { value: 'light', label: 'Light', icon: 'white-balance-sunny' },
                            { value: 'dark', label: 'Dark', icon: 'weather-night' },
                            { value: 'system', label: 'System', icon: 'cellphone' },
                        ]}
                    />
                </List.Section>
            </Card>

            <Card style={styles.card} elevation={1}>
                <List.Section>
                    <List.Item
                        title="Notifications"
                        description="Recipe suggestions and reminders"
                        right={() => (
                            <Switch
                                value={settings.notifications}
                                onValueChange={(value) => setSettings((prev) => ({ ...prev, notifications: value }))}
                            />
                        )}
                    />
                </List.Section>
            </Card>

            <Card style={styles.card} elevation={1}>
                <List.Section>
                    <List.Item
                        title="Clear favorites"
                        description={`${count} saved ${count === 1 ? 'recipe' : 'recipes'}`}
                        left={(props) => <List.Icon {...props} icon="heart-broken" />}
                        onPress={() => count > 0 && setConfirmClear(true)}
                        disabled={count === 0}
                    />
                </List.Section>
            </Card>

            <Text style={styles.version}>Cookbook v1.0.0</Text>

            <Portal>
                <Dialog visible={confirmClear} onDismiss={() => setConfirmClear(false)}>
                    <Dialog.Title>Clear favorites?</Dialog.Title>
                    <Dialog.Content>
                        <Text style={{ color: tc('#3E2723') }}>This removes all {count} saved recipes from this device.</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setConfirmClear(false)}>Cancel</Button>
                        <Button
                            textColor={tc('#C62828')}
                            onPress={() => {
                                clearFavorites();
                                setConfirmClear(false);
                            }}
                        >
                            Clear
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </ScrollView>
    );
}

const styles = createStyles({
    container: { flex: 1, backgroundColor: '#FFFDF8' },
    content: { padding: 16, gap: 16, maxWidth: 720, width: '100%', alignSelf: 'center' },
    card: { borderRadius: 16, backgroundColor: '#FFFFFF' },
    segmented: { marginHorizontal: 16, marginBottom: 12 },
    version: { textAlign: 'center', color: '#BCAAA4', fontSize: 12, marginTop: 8 },
});