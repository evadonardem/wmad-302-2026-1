/**
 * Cart Screen Styles - soft minimal (cream, sage, serif)
 * Phone: list + fixed summary at the bottom. Tablet / web: list on the left, summary card on the right.
 */
import { StyleSheet } from 'react-native';
import { palette, radius, spacing, typeface, MAX_CONTENT_WIDTH, themed } from '@/constants/theme';

const serif = { fontFamily: typeface.display } as const;

export const styles = themed(() =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.ivory },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.ivory },
    loadingText: { marginTop: spacing.md, fontSize: 13, color: palette.stone },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
    emptyTitle: { ...serif, fontSize: 26, color: palette.ink, marginTop: spacing.lg },
    emptyText: { fontSize: 14, color: palette.stone, marginTop: spacing.sm, textAlign: 'center' },
    browseButton: { marginTop: spacing.lg, borderRadius: radius.sm },
    buttonContent: { height: 48, paddingHorizontal: spacing.lg },
    buttonText: { fontSize: 14, fontWeight: '600' },

    // Layout
    layout: { flex: 1, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
    layoutWide: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xl, paddingHorizontal: spacing.xl },
    list: { flex: 1 },
    listContent: { paddingHorizontal: spacing.md, paddingBottom: 120 },
    listContentPhone: { paddingBottom: 380 }, // Space for summary
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.lg },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { ...serif, flex: 1, fontSize: 26, color: palette.ink },
    headerCount: { fontSize: 13, color: palette.stone },

    // Cart item
    cartItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: palette.surface, borderRadius: radius.lg },
    itemImage: { width: 96, height: 96, borderRadius: radius.md, marginRight: spacing.md, backgroundColor: palette.beige },
    itemInfo: { flex: 1 },
    itemTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: palette.ink },
    itemPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginTop: 4, marginBottom: spacing.sm },
    itemCurrentPrice: { ...serif, fontSize: 20, color: palette.ink },
    itemOriginalPrice: { fontSize: 13, color: palette.mist, textDecorationLine: 'line-through' },
    quantityControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    qtyButton: { width: 30, height: 30, borderRadius: radius.sm, backgroundColor: palette.sage, alignItems: 'center', justifyContent: 'center' },
    qtyButtonDisabled: { backgroundColor: palette.mist },
    quantityText: { fontSize: 16, fontWeight: '600', color: palette.ink, minWidth: 24, textAlign: 'center' },
    separator: { height: spacing.sm },

    // Summary
    summaryContainer: {
      position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: palette.ivory,
      borderTopWidth: 1, borderTopColor: palette.line, padding: spacing.md, paddingBottom: spacing.lg,
    },
    summaryWide: { width: 360, marginTop: 96, padding: spacing.lg, backgroundColor: palette.surface, borderRadius: radius.xl },
    couponRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
    summaryLabel: { fontSize: 14, color: palette.stone },
    summaryValue: { fontSize: 14, fontWeight: '600', color: palette.ink },
    discountValue: { fontSize: 14, fontWeight: '600', color: palette.success },
    summaryRowDivider: { height: 1, backgroundColor: palette.line, marginVertical: spacing.sm },
    summaryRowTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.md },
    summaryLabelTotal: { ...serif, fontSize: 20, color: palette.ink },
    summaryValueTotal: { ...serif, fontSize: 24, color: palette.ink },
    checkoutButton: { borderRadius: radius.sm },
  })
);