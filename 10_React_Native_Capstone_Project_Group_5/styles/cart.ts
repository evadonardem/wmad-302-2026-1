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
    spinPickButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius.pill, backgroundColor: palette.forest, marginBottom: spacing.sm },
    spinPickText: { fontSize: 14, fontWeight: '700', color: palette.surface },

    // Cart item
    cartItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1.5, borderColor: 'transparent' },
    cartItemChecked: { borderColor: palette.forest, backgroundColor: palette.accentSoft },
    check: { marginRight: spacing.sm, padding: 2 },
    itemDimmed: { opacity: 0.45 },
    itemLineTotal: { ...serif, fontSize: 16, color: palette.ink, marginTop: 6, alignSelf: 'flex-end' },
    selectAll: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.sm, backgroundColor: palette.surface, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line },
    selectAllText: { fontSize: 14, fontWeight: '700', color: palette.ink },
    selectAllHint: { fontSize: 12, color: palette.stone },
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
    summaryToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4, marginBottom: spacing.sm },
    summaryToggleTitle: { fontSize: 15, fontWeight: '700', color: palette.ink },
    summaryToggleRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    summaryToggleTotal: { fontSize: 14, fontWeight: '700', color: palette.forest },
    couponRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    rewardSection: { marginBottom: spacing.md, padding: spacing.sm, borderRadius: radius.md, backgroundColor: palette.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line, gap: spacing.sm },
    rewardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    rewardTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: palette.ink },
    rewardHint: { fontSize: 12, color: palette.stone },
    rewardList: { gap: 8 },
    rewardOption: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: 10, borderRadius: radius.md, backgroundColor: palette.ivory, borderWidth: 1, borderColor: 'transparent' },
    rewardOptionActive: { borderColor: palette.forest, backgroundColor: palette.accentSoft },
    rewardOptionText: { flex: 1, minWidth: 0 },
    rewardOptionTitle: { fontSize: 13, fontWeight: '600', color: palette.ink },
    rewardOptionTitleActive: { color: palette.forest },
    rewardOptionSub: { fontSize: 11, color: palette.stone, marginTop: 1 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
    summaryLabel: { fontSize: 14, color: palette.stone },
    summaryValue: { fontSize: 14, fontWeight: '600', color: palette.ink },
    discountValue: { fontSize: 14, fontWeight: '600', color: palette.success },
    summaryRowDivider: { height: 1, backgroundColor: palette.line, marginVertical: spacing.sm },
    summaryRowTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.md },
    summaryLabelTotal: { ...serif, fontSize: 20, color: palette.ink },
    summaryValueTotal: { ...serif, fontSize: 24, color: palette.ink },
    checkoutButton: { borderRadius: radius.sm },

    // Checkout pop-up
    checkoutSummary: {
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: palette.accentSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: palette.line,
      gap: 2,
    },
    checkoutSummaryLabel: { fontSize: 10, letterSpacing: 1.8, fontWeight: '700', color: palette.stone },
    checkoutTotal: { ...serif, fontSize: 30, color: palette.ink },
    checkoutMeta: { fontSize: 12, color: palette.stone },
    checkoutField: { backgroundColor: palette.surface, borderRadius: radius.md },
    checkoutOutline: { borderRadius: 14, borderColor: palette.line },

    // Payment choices
    payList: { gap: spacing.sm },
    payOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderColor: palette.line,
      backgroundColor: palette.surface,
    },
    payOptionActive: { borderColor: palette.forest, backgroundColor: palette.accentSoft },
    payIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: palette.sand, alignItems: 'center', justifyContent: 'center' },
    payIconActive: { backgroundColor: palette.forest },
    payText: { flex: 1, minWidth: 0 },
    payTitle: { fontSize: 14, fontWeight: '700', color: palette.ink },
    payTitleActive: { color: palette.forest },
    paySub: { fontSize: 11, color: palette.stone, marginTop: 1 },
    secureNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
    secureNoteText: { flex: 1, fontSize: 11, lineHeight: 16, color: palette.stone },

    // Order confirmation
    confirmWrap: { alignItems: 'center', paddingVertical: spacing.sm, gap: 4 },
    confirmBadge: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: palette.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    confirmTitle: { ...serif, fontSize: 22, color: palette.ink, textAlign: 'center' },
    confirmSub: { fontSize: 13, color: palette.stone },
    confirmCard: {
      alignSelf: 'stretch',
      marginTop: spacing.md,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: palette.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: palette.line,
      gap: spacing.sm,
    },
    confirmRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
    confirmLabel: { fontSize: 12, color: palette.stone },
    confirmValue: { flexShrink: 1, fontSize: 13, fontWeight: '600', color: palette.ink, textAlign: 'right' },
    confirmNote: { fontSize: 12, lineHeight: 18, color: palette.stone, textAlign: 'center', marginTop: spacing.sm },
  })
);