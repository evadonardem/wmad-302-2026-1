/**
 * Search Screen Styles - Shared base
 * Soft minimal: discovery view (recent / trending / popular) + filter panel + result rows
 */
import { StyleSheet } from 'react-native';
import { palette, radius, spacing, typeface, themed, MAX_CONTENT_WIDTH } from '@/constants/theme';

const serif = { fontFamily: typeface.display } as const;

const chip = () =>
  ({
    paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: palette.sand,
  }) as const;

export const styles = themed(() =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.ivory },
    content: { paddingTop: spacing.lg, paddingBottom: 120, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' }, // wide pages use the whole screen; results become columns

    // Search bar
    searchRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
    searchBox: {
      flex: 1, height: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md,
      borderRadius: radius.md, borderWidth: 1.5, borderColor: palette.line, backgroundColor: palette.surface,
    },
    searchBoxFocused: { borderColor: palette.sage },
    searchInput: { flex: 1, fontSize: 15, color: palette.ink, height: '100%' },
    filterButton: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: palette.sage, alignItems: 'center', justifyContent: 'center' },
    filterButtonOff: { backgroundColor: palette.sand },

    // Discovery sections
    section: { marginBottom: spacing.lg },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    sectionTitle: { ...serif, fontSize: 20, color: palette.ink },
    sectionLink: { fontSize: 13, fontWeight: '600', color: palette.sage },
    recentWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    recentChip: { ...chip(), flexDirection: 'row', alignItems: 'center', gap: 6 },
    recentText: { fontSize: 13, color: palette.ink },
    trendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
    trendBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    trendBadgeText: { fontSize: 12, fontWeight: '700', color: palette.sage },
    trendText: { flex: 1, fontSize: 14, color: palette.ink },
    popularGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.sm },
    popularTile: { width: '48.5%', height: 76, borderRadius: radius.lg, backgroundColor: palette.beige, alignItems: 'center', justifyContent: 'center' },
    popularText: { ...serif, fontSize: 17, color: palette.ink },

    // Active filters + panel
    activeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
    activeChip: { ...chip(), flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: palette.sage },
    activeChipText: { fontSize: 12, color: palette.surface, fontWeight: '600' },
    filterPanel: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg },
    filterSection: { marginBottom: spacing.md },
    sortSection: { marginBottom: 0 },
    filterTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: palette.stone, marginBottom: spacing.sm },
    filterList: { gap: spacing.sm },
    filterChip: chip(),
    filterChipSelected: { backgroundColor: palette.night },
    filterChipText: { fontSize: 12, color: palette.ink },
    filterChipTextSelected: { color: palette.surface, fontWeight: '600' },
    sortOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    sortChip: chip(),
    sortChipSelected: { backgroundColor: palette.night },
    sortChipText: { fontSize: 12, color: palette.ink },
    sortChipTextSelected: { color: palette.surface, fontWeight: '600' },
    priceRow: { flexDirection: 'row', alignItems: 'center' },
    priceInput: { flex: 1, backgroundColor: palette.surface },
    priceDash: { marginHorizontal: spacing.sm, fontSize: 16, color: palette.stone },

    // Results
    resultsTitle: { ...serif, fontSize: 20, color: palette.ink, marginBottom: spacing.md },
    resultRow: { gap: spacing.sm },
    resultCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, backgroundColor: palette.surface, borderRadius: radius.lg },
    resultImage: { width: 84, height: 84, borderRadius: radius.md, backgroundColor: palette.beige, marginRight: spacing.md },
    resultInfo: { flex: 1, justifyContent: 'center' },
    resultCategory: { fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: palette.sage, fontWeight: '600', marginBottom: 2 },
    resultTitle: { fontSize: 15, fontWeight: '600', color: palette.ink, marginBottom: 4 },
    resultPrice: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginBottom: 2 },
    currentPrice: { fontSize: 15, fontWeight: '700', color: palette.ink },
    originalPrice: { fontSize: 12, color: palette.mist, textDecorationLine: 'line-through' },
    resultDetails: { fontSize: 12, color: palette.stone },
    loadingCenter: { paddingVertical: spacing.xxl, alignItems: 'center' },
    emptyState: { paddingVertical: 60, alignItems: 'center' },
    emptyText: { ...serif, fontSize: 20, color: palette.ink, marginTop: spacing.md },
    emptySubtext: { fontSize: 13, color: palette.stone, marginTop: 4 },
    separator: { height: spacing.sm },

    // Discovery on wide screens: recent + trending on the left, popular categories on the right
    discoveryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xl },
    discoveryLeft: { flex: 1 },
    discoveryRight: { width: 520 },
  })
);