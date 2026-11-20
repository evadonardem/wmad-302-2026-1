import { StyleSheet } from 'react-native';
import { GLASS_PALETTE, DARK_AMBIENT_BG, glassSurface } from '@/constants/glassTheme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GLASS_PALETTE.canvasBg, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 100, ...DARK_AMBIENT_BG },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  pageSubtitle: { fontSize: 15, color: GLASS_PALETTE.textMuted, marginBottom: 20 },
  gridWrapper: { justifyContent: 'space-between' },
  gridContent: { paddingBottom: 20 },
  categoryCard: { width: '48%', marginBottom: 16 },
  card: { ...glassSurface(0.8, 18, true), height: '100%' },
  cardContent: { padding: 20, alignItems: 'center' },
  iconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(225, 29, 72, 0.22)', borderWidth: 1, borderColor: GLASS_PALETTE.crimsonBorder, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  categoryName: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', marginBottom: 4 },
  categoryCount: { fontSize: 12, color: GLASS_PALETTE.textMuted, fontWeight: '600' },
  separator: { height: 8, width: '100%' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: GLASS_PALETTE.textSecondary },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  errorText: { fontSize: 16, color: GLASS_PALETTE.crimsonBright, textAlign: 'center' },
  guideContainer: { ...glassSurface(0.75, 16, true), marginTop: 24, padding: 16 },
  guideTitle: { fontSize: 14, fontWeight: '800', color: GLASS_PALETTE.crimsonBright, marginBottom: 8 },
  guideText: { fontSize: 13, color: GLASS_PALETTE.textSecondary, lineHeight: 20 },
});
