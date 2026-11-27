import { StyleSheet } from 'react-native';
import { theme as appTheme } from '@/constants/theme';

export function createAuthStyles(theme: typeof appTheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    brand: { alignItems: 'center', marginBottom: 24 },
    brandName: { color: theme.colors.primary, fontWeight: '700' },
    tagline: { color: theme.colors.onSurfaceVariant, marginTop: 4 },
    card: { width: '100%', maxWidth: 520, alignSelf: 'center' },
    cardContent: { padding: 24, gap: 12 },
    title: { textAlign: 'center' },
    subtitle: { textAlign: 'center', color: theme.colors.onSurfaceVariant, marginBottom: 12 },
    errorBanner: { backgroundColor: theme.colors.errorContainer, borderRadius: 8, padding: 12 },
    errorText: { color: theme.colors.error },
    primaryButton: { marginTop: 8 },
    buttonContent: { minHeight: 48 },
    divider: { marginVertical: 8 },
    footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
    row: { flexDirection: 'row', gap: 12 },
    half: { flex: 1 },
    genderLabel: { marginTop: 8 },
    genderRow: { marginBottom: 8 },
    termsRow: { flexDirection: 'row', alignItems: 'center' },
    termsText: { flex: 1 },
  });
}
