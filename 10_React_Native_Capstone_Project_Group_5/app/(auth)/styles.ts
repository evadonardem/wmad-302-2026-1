/**
 * Auth screens styles (login + register) - React Native + Paper, fully responsive
 * No fixed widths: the card fills small screens and stops at 440px on big ones.
 */
import { StyleSheet } from 'react-native';
import { palette, radius, spacing, typeface, softShadow, themed } from '@/constants/theme';

const serif = { fontFamily: typeface.display } as const;

export const styles = themed(() =>
  StyleSheet.create({
    flex: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xl },
    card: {
      width: '100%', maxWidth: 440, alignSelf: 'center', backgroundColor: palette.surface, borderRadius: radius.xl,
      padding: spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line, ...softShadow('#3A1E70', 0.14, 24, 10, 6),
    },
    logo: { width: 56, height: 56, borderRadius: 28, backgroundColor: palette.forest, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: spacing.md },
    brand: { ...serif, fontSize: 14, letterSpacing: 4, color: palette.forest, textAlign: 'center' },
    title: { ...serif, fontSize: 30, color: palette.ink, textAlign: 'center', marginTop: spacing.sm },
    subtitle: { fontSize: 14, color: palette.stone, textAlign: 'center', marginTop: 4, marginBottom: spacing.lg },
    input: { backgroundColor: palette.surface, marginTop: spacing.sm },
    row: { flexDirection: 'row', gap: spacing.sm },
    half: { flex: 1 },
    button: { marginTop: spacing.md, borderRadius: radius.pill },
    buttonContent: { height: 52 },
    buttonLabel: { fontSize: 15, fontWeight: '700' },
    divider: { height: 1, backgroundColor: palette.line, marginVertical: spacing.lg },
    demo: { borderRadius: radius.pill },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', marginTop: spacing.md },
    footerText: { fontSize: 14, color: palette.stone },
    terms: { fontSize: 12, lineHeight: 18, color: palette.stone, textAlign: 'center', marginTop: spacing.lg, paddingHorizontal: spacing.md, maxWidth: 440, alignSelf: 'center' },
    error: { marginTop: spacing.sm },
  })
);