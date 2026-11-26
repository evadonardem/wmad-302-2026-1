/**
 * Categories Screen Styles
 * Soft minimal: round header buttons, group chips, a collection banner, sub-category chips,
 * a responsive grid of tall image tiles and a Featured Brands strip.
 */
import { StyleSheet } from 'react-native';
import { MAX_CONTENT_WIDTH, palette, radius, spacing, typeface, themed, withAlpha } from '@/constants/theme';

const serif = { fontFamily: typeface.display } as const;
const CREAM = '#FBF7FF';

export const styles = themed(() =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.ivory },
    listContent: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', paddingBottom: 120 },
    bgDecor: { position: 'absolute', top: 0, left: 0, right: 0, height: 420, overflow: 'hidden' },
    bgTopBand: { position: 'absolute', top: 0, left: 0, right: 0, height: 220, backgroundColor: withAlpha(palette.accentSoft, 0.55) },
    bgSoftArc: { position: 'absolute', top: 120, left: -40, right: -40, height: 220, borderRadius: 220, backgroundColor: withAlpha(palette.blush, 0.7), transform: [{ scaleX: 1.2 }] },
    bgAccentStrip: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: withAlpha(palette.accent, 0.35) },
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

    // Collection banner (dark hero with an abstract, layered background)
    banner: { borderRadius: 26, backgroundColor: '#3A1E70', overflow: 'hidden', marginBottom: spacing.md, padding: spacing.lg },
    bannerWide: { minHeight: 280, flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.lg },
    bannerCircle: { position: 'absolute', right: -60, top: -70, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(255,255,255,0.06)' },
    bannerGlow: { position: 'absolute', left: -90, bottom: -130, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(205,184,245,0.16)' },
    bannerRingGold: { position: 'absolute', right: 20, top: -80, width: 340, height: 340, borderRadius: 170, borderWidth: 1.5, borderColor: 'rgba(242,196,90,0.28)' },
    bannerRingLight: { position: 'absolute', right: 90, top: -10, width: 210, height: 210, borderRadius: 105, borderWidth: 1, borderColor: 'rgba(251,247,255,0.16)' },
    bannerTile: {
      position: 'absolute',
      right: 70,
      bottom: 24,
      width: 130,
      height: 130,
      borderRadius: 30,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
      backgroundColor: 'rgba(255,255,255,0.04)',
      transform: [{ rotate: '14deg' }],
    },
    bannerDot: { position: 'absolute', right: 58, top: 42, width: 10, height: 10, borderRadius: 5, backgroundColor: palette.gold },
    bannerSparkA: { position: 'absolute', right: 210, top: 40, opacity: 0.8 },
    bannerSparkB: { position: 'absolute', right: 46, bottom: 70, opacity: 0.8 },
    bannerSparkC: { position: 'absolute', right: 250, bottom: 30, opacity: 0.7 },
    bannerText: { minWidth: 0 },
    bannerTextWide: { flex: 1, maxWidth: 430 },
    bannerEyebrow: { fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: palette.gold, fontWeight: '600' },
    bannerTitle: { ...serif, fontSize: 30, lineHeight: 35, color: CREAM, marginTop: 6 },
    bannerSub: { fontSize: 13, color: 'rgba(251,247,255,0.85)', marginTop: 6 },
    bannerButton: { alignSelf: 'flex-start', marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 18, borderRadius: radius.pill, backgroundColor: CREAM },
    bannerButtonText: { fontSize: 13, fontWeight: '700', color: '#3A1E70' },

    // Section titles
    sectionTitle: { ...serif, fontSize: 20, color: palette.ink, marginTop: spacing.sm, marginBottom: spacing.sm },

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
  })
);