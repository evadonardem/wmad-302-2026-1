/**
 * Categories Screen Styles
 * Soft minimal: round header buttons, group chips, a collection banner, sub-category chips,
 * a responsive grid of tall image tiles and a Featured Brands strip.
 */
import { StyleSheet } from 'react-native';
import { MAX_CONTENT_WIDTH, palette, radius, spacing, typeface, themed } from '@/constants/theme';

const serif = { fontFamily: typeface.display } as const;
const CREAM = '#FBF7FF';

export const styles = themed(() =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.ivory },
    listContent: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', paddingBottom: 120 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.lg, paddingBottom: spacing.md },
    pageTitle: { ...serif, fontSize: 28, color: palette.ink },
    headerButtons: { flexDirection: 'row', gap: spacing.sm },
    roundButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' },
    badge: {
      position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4,
      backgroundColor: palette.danger, alignItems: 'center', justifyContent: 'center',
    },
    badgeText: { fontSize: 9, fontWeight: '700', color: '#FFFFFF' },
    gridRow: { gap: spacing.sm, marginBottom: spacing.sm },

    // Group chips (parent categories)
    groupRow: { gap: spacing.sm, paddingBottom: spacing.md },
    group: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, height: 44, borderRadius: radius.pill, backgroundColor: palette.blush, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line },
    groupActive: { backgroundColor: palette.forest, borderColor: palette.forest },
    groupText: { fontSize: 14, fontWeight: '500', color: palette.ink },
    groupTextActive: { color: palette.surface, fontWeight: '700' },

    // Collection banner
    banner: { minHeight: 190, borderRadius: 24, backgroundColor: '#3A1E70', overflow: 'hidden', justifyContent: 'center', marginBottom: spacing.md },
    bannerWide: { minHeight: 230 },
    bannerCircle: { position: 'absolute', right: -60, top: -70, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(255,255,255,0.06)' },
    bannerText: { padding: spacing.lg, width: '60%' },
    bannerEyebrow: { fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: palette.gold, fontWeight: '600' },
    bannerTitle: { ...serif, fontSize: 30, lineHeight: 35, color: CREAM, marginTop: 6 },
    bannerSub: { fontSize: 13, color: 'rgba(251,247,255,0.85)', marginTop: 6 },
    bannerButton: { alignSelf: 'flex-start', marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 18, borderRadius: radius.pill, backgroundColor: CREAM },
    bannerButtonText: { fontSize: 13, fontWeight: '700', color: '#3A1E70' },
    bannerImages: { position: 'absolute', right: 10, top: 12, bottom: 8, width: '42%' },
    bannerImageMain: { position: 'absolute', left: '22%', right: '4%', top: 0, bottom: 0 },
    bannerImageSide: { position: 'absolute', left: '-6%', width: '48%', height: '58%', bottom: 4, opacity: 0.85 },
    fill: { width: '100%', height: '100%' },

    // Sub-categories + section titles
    sectionTitle: { ...serif, fontSize: 20, color: palette.ink, marginTop: spacing.sm, marginBottom: spacing.sm },
    subRow: { gap: spacing.sm, paddingBottom: spacing.md },
    subChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 36, borderRadius: radius.pill, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
    subChipText: { fontSize: 13, color: palette.ink },
    subChipCount: { fontSize: 11, color: palette.stone },

    // Tile
    tile: { borderRadius: radius.xl, backgroundColor: palette.sand, overflow: 'hidden', justifyContent: 'flex-end' },
    tileImage: { position: 'absolute', top: 14, left: 14, right: 14, bottom: 62 },
    tileLabel: { paddingVertical: 10, paddingHorizontal: spacing.md, backgroundColor: 'rgba(36,21,64,0.72)', alignItems: 'center' },
    tileName: { fontSize: 14, fontWeight: '700', color: CREAM },
    tileCount: { fontSize: 11, color: 'rgba(251,247,255,0.8)', marginTop: 1 },

    // Featured brands
    brandsSection: { marginTop: spacing.lg },
    brandRow: { gap: spacing.md, paddingBottom: spacing.sm },
    brandCard: { width: 112, alignItems: 'center' },
    brandCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: palette.sand, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: palette.line },
    brandImage: { width: '74%', height: '74%' },
    brandName: { fontSize: 13, fontWeight: '600', color: palette.ink, marginTop: 8, textAlign: 'center' },
    brandCount: { fontSize: 11, color: palette.stone, marginTop: 1 },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.ivory },
    loadingText: { marginTop: spacing.md, fontSize: 13, color: palette.stone },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg, backgroundColor: palette.ivory },
    errorText: { fontSize: 14, color: palette.danger, textAlign: 'center' },
    retry: { marginTop: spacing.md, fontSize: 13, fontWeight: '600', color: palette.forest },
    emptyText: { fontSize: 14, color: palette.stone, textAlign: 'center', paddingVertical: spacing.xl },
    guideContainer: { marginTop: spacing.lg, padding: spacing.md, backgroundColor: palette.accentSoft, borderRadius: radius.lg },
    guideTitle: { fontSize: 12, fontWeight: '700', color: palette.forest, marginBottom: spacing.sm },
    guideText: { fontSize: 13, color: palette.stone, lineHeight: 21 },
  })
);