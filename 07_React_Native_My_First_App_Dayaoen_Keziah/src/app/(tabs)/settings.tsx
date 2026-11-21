import { useState } from 'react';
import { Appearance, Platform, Share, StyleSheet, Text, View } from 'react-native';
import * as Print from 'expo-print';
import GeneralSettings, { type SettingsAction } from '@/components/GeneralSettings';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '@/favorites';
import { useTheme, useThemeMode } from '@/theme';

type WebWindow = {
  document: { write: (html: string) => void; close: () => void };
  focus: () => void;
  print: () => void;
};

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default function SettingsScreen() {
  const theme = useTheme();
  const { isDarkMode, setIsDarkMode } = useThemeMode();
  const { favorites } = useFavorites();
  const [status, setStatus] = useState('');

  // Text used by Share (and as a plain-text summary).
  const buildMessage = () =>
    favorites.length === 0
      ? 'Check out this Quote Generator app!'
      : 'My favorite quotes:\n\n' +
        favorites.map((q) => `"${q.text}" — ${q.author}`).join('\n\n');

  // Theme: match the device's light/dark setting.
  const handleTheme = () => {
    const system = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
    setIsDarkMode(system === 'dark');
    setStatus(`Theme set to match your device (${system}).`);
  };

  // Print: print the favorites list.
  const handlePrint = async () => {
    if (favorites.length === 0) {
      setStatus('Nothing to print yet — add a favorite first.');
      return;
    }
    const html =
      '<html><body style="font-family: sans-serif; padding: 24px;">' +
      '<h2>My Favorite Quotes</h2>' +
      favorites
        .map(
          (q) =>
            `<p><em>"${escapeHtml(q.text)}"</em><br/>— ${escapeHtml(q.author)}</p>`,
        )
        .join('') +
      '</body></html>';

    try {
      if (Platform.OS === 'web') {
        const printWindow = (globalThis as unknown as {
          open: (url: string, target: string) => WebWindow | null;
        }).open('', '_blank');
        if (!printWindow) {
          setStatus('Allow pop-ups to print from the browser.');
          return;
        }
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      } else {
        await Print.printAsync({ html });
      }
      setStatus('');
    } catch {
      setStatus('Printing is not available right now.');
    }
  };

  // Share: share favorites via the system share sheet (clipboard fallback on desktop web).
  const handleShare = async () => {
    const message = buildMessage();
    try {
      if (Platform.OS === 'web') {
        const nav = (globalThis as unknown as {
          navigator?: {
            share?: unknown;
            clipboard?: { writeText: (text: string) => Promise<void> };
          };
        }).navigator;
        if (!nav?.share) {
          await nav?.clipboard?.writeText(message);
          setStatus('Copied to clipboard — paste it anywhere to share.');
          return;
        }
      }
      await Share.share({ message });
      setStatus('');
    } catch {
      setStatus('Sharing is not available on this device.');
    }
  };

  // TODO 15: first action toggles dark/light mode and swaps its icon and label.
  const actions: SettingsAction[] = [
    {
      icon: isDarkMode ? (
        <Ionicons name="sunny" size={22} color={theme.colors.text} />
      ) : (
        <Ionicons name="moon" size={22} color={theme.colors.text} />
      ),
      name: isDarkMode ? 'Light Mode' : 'Dark Mode',
      onPress: () => setIsDarkMode((prev) => !prev),
    },
    {
      icon: <Ionicons name="color-palette" size={22} color={theme.colors.text} />,
      name: 'Theme',
      onPress: handleTheme,
    },
    {
      icon: <Ionicons name="print" size={22} color={theme.colors.text} />,
      name: 'Print',
      onPress: handlePrint,
    },
    {
      icon: <Ionicons name="share-social" size={22} color={theme.colors.text} />,
      name: 'Share',
      onPress: handleShare,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GeneralSettings actions={actions} />
      {status !== '' && (
        <Text style={[styles.status, { color: theme.colors.textSecondary }]}>{status}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    padding: 16,
  },
  status: {
    marginTop: 16,
    fontSize: 13,
    textAlign: 'center',
  },
});
