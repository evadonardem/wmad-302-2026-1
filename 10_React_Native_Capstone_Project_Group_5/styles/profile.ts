/**
 * Profile Screen Styles - Shared
 * Soft minimal: a green identity card, stat tiles, the Style Passport, icon-tile menus.
 * Wide screens put identity + passport on the left and the menus on the right.
 */
import { StyleSheet } from 'react-native';
import { MAX_CONTENT_WIDTH, palette, radius, spacing, typeface, themed } from '@/constants/theme';

const serif = { fontFamily: typeface.display } as const;
const CREAM = '#FBF7FF';

export const styles = themed(() =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.ivory },
    content: { paddingTop: spacing.lg, paddingBottom: 120, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.ivory },
    notLoggedIn: { fontSize: 14, color: palette.stone },

    // Layout
    columns: { gap: spacing.lg },
    columnsWide: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xl },
    leftCol: { gap: spacing.lg },
    leftColWide: { flex: 1.1 },
    rightCol: { gap: spacing.md },
    rightColWide: { flex: 1 },

    // Identity card
    hero: { borderRadius: 28, backgroundColor: '#3A1E70', paddingVertical: spacing.xl, paddingHorizontal: spacing.lg, alignItems: 'center', overflow: 'hidden' },
    heroCircleA: { position: 'absolute', right: -50, top: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.06)' },
    heroCircleB: { position: 'absolute', left: -70, bottom: -90, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(255,255,255,0.05)' },
    heroEdit: { position: 'absolute', top: spacing.md, right: spacing.md, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(251,247,255,0.16)', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
    avatar: { backgroundColor: 'rgba(251,247,255,0.2)', borderWidth: 3, borderColor: 'rgba(251,247,255,0.5)', marginBottom: spacing.md },
    name: { ...serif, fontSize: 28, color: CREAM },
    username: { fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: palette.gold, marginTop: 4, fontWeight: '600' },
    email: { fontSize: 13, color: 'rgba(251,247,255,0.8)', marginTop: 4 },
    tierPill: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md, paddingHorizontal: 14, height: 32, borderRadius: radius.pill, backgroundColor: 'rgba(232,200,121,0.18)', borderWidth: 1, borderColor: 'rgba(232,200,121,0.5)' },
    tierPillText: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: palette.gold },

    // Stat tiles
    statsRow: { flexDirection: 'row', gap: spacing.sm },
    statCard: { flex: 1, backgroundColor: palette.surface, borderRadius: radius.lg, paddingVertical: spacing.md, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line },
    statIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    statValue: { ...serif, fontSize: 20, color: palette.ink },
    statLabel: { fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: palette.stone, marginTop: 2 },

    // Menus
    menuCard: { backgroundColor: palette.surface, borderRadius: radius.xl, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 14, paddingHorizontal: spacing.md },
    menuDivider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.line, marginLeft: 72 },
    menuIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
    menuBadge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: palette.danger, alignItems: 'center', justifyContent: 'center' },
    menuBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
    menuText: { flex: 1 },
    menuTitle: { fontSize: 15, fontWeight: '600', color: palette.ink },
    menuDesc: { fontSize: 12, color: palette.stone, marginTop: 2 },

    // Logout
    logoutButton: { borderRadius: radius.pill, borderWidth: 1, borderColor: palette.danger, height: 52 },
    logoutButtonContent: { height: 52, paddingHorizontal: spacing.lg },
    logoutButtonText: { fontSize: 14, fontWeight: '700', color: palette.danger },

    // Version
    version: { alignItems: 'center', paddingVertical: spacing.md },
    versionText: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: palette.mist },

    // Payment methods + settings dialogs
    dialogNote: { fontSize: 12, lineHeight: 18, color: palette.stone, marginTop: spacing.md, marginBottom: spacing.sm },
    methodActions: { flexDirection: 'row', alignItems: 'center' },
    emptyMethods: { paddingVertical: spacing.lg, textAlign: 'center', color: palette.stone },
    settingsLabel: { fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '700', color: palette.stone, marginTop: spacing.md, marginBottom: spacing.sm },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
    formGap: { marginTop: spacing.sm },

    // Pop-up card contents
    logoutNote: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: palette.accentSoft },
    logoutNoteText: { flex: 1, fontSize: 13, lineHeight: 19, color: palette.forest },
    editIdentity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: palette.ivory, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line },
    editIdentityText: { flex: 1 },
    editName: { fontSize: 15, fontWeight: '700', color: palette.ink },
    editHandle: { fontSize: 12, color: palette.stone, marginTop: 2 },
    dialogInput: { backgroundColor: palette.surface, borderRadius: radius.md },
    dialogOutline: { borderRadius: 14, borderColor: palette.line },
    orderSummary: { flexDirection: 'row', padding: spacing.md, borderRadius: radius.lg, backgroundColor: palette.accentSoft, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line },
    orderStat: { flex: 1, alignItems: 'center', gap: 2 },
    orderStatLabel: { fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: '700', color: palette.stone },
    orderStatValue: { ...serif, fontSize: 18, color: palette.ink },
    ordersLoading: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
    ordersLoadingText: { fontSize: 13, color: palette.stone },
    orderMeta: { gap: 6, padding: spacing.md, borderRadius: radius.lg, backgroundColor: palette.ivory, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line },
    orderMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    orderMetaText: { flex: 1, fontSize: 12, color: palette.stone },
    smallLabel: { fontSize: 11, fontWeight: '700' },
    fillExample: { alignSelf: 'flex-start' },
    dialogWideButton: { borderRadius: radius.md, marginTop: spacing.xs },
    dialogWideButtonContent: { height: 44 },
  })
);