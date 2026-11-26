/**
 * Home Screen Styles - Marketplace
 * Boutique layout: deep green banners on a warm cream page, pill categories, bento product grid.
 * Responsive sizes (columns, padding) are computed in home.tsx with useResponsive.
 */
import { StyleSheet } from 'react-native';
import { MAX_CONTENT_WIDTH, palette, radius, spacing, typeface, themed, softShadow } from '@/constants/theme';

const serif = { fontFamily: typeface.display } as const;

export const styles = themed(() =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.ivory },
  // Centred column: full width on phones, capped on tablet / web
  content: { paddingBottom: 120, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' }, // Space for tab bar
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.ivory },
  loadingText: { marginTop: spacing.md, fontSize: 13, color: palette.stone },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg, backgroundColor: palette.ivory },
  errorText: { fontSize: 14, color: palette.danger, textAlign: 'center', marginBottom: spacing.md },

  // Header: brand, search pill, cart, account
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.md },
  headerStacked: { paddingTop: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  brandRowMobile: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerIconsRowMobile: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  mobileMenuToggle: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line, alignItems: 'center', justifyContent: 'center' },
  mobileMenuOverlay: { position: 'absolute', top: 68, right: 0, zIndex: 30, elevation: 8, backgroundColor: palette.surface, padding: 8, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  brandText: { ...serif, fontSize: 20, letterSpacing: 1, color: palette.forest, flexShrink: 1 },
  brandTag: { fontSize: 11, color: palette.stone, marginTop: 1, flexShrink: 1 },
  searchPill: {
    flex: 1, minWidth: 0, height: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: radius.pill, backgroundColor: palette.blush, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line,
  },
  searchPillStacked: { flex: 0, width: '100%', marginTop: 0 },
  searchText: { fontSize: 14, color: palette.stone },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 0 },
  themeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: palette.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line, alignItems: 'center', justifyContent: 'center' },
  cartButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: palette.forest, alignItems: 'center', justifyContent: 'center' },
  cartBadge: {
    position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
    backgroundColor: palette.gold, alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText: { fontSize: 10, fontWeight: '800', color: '#241540' },
  headerDivider: { width: 1, height: 28, backgroundColor: palette.line },
  accountButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  accountName: { fontSize: 13, fontWeight: '600', color: palette.ink },

  // Category pills
  // flexGrow + centre: the pills sit in the middle when they fit, and scroll sideways when they do not
  pillRow: { flexGrow: 1, justifyContent: 'center', flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, height: 52, borderRadius: radius.pill, backgroundColor: palette.blush,
    borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line,
  },
  pillActive: { backgroundColor: palette.forest, borderColor: palette.forest, paddingHorizontal: 26, height: 58 },
  pillText: { fontSize: 14, fontWeight: '500', color: palette.ink },
  pillTextActive: { color: palette.surface, fontWeight: '700' },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, paddingVertical: spacing.sm },
  pillChevron: { width: 44, height: 44, borderRadius: 22, backgroundColor: palette.blush, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },

  // Banner row
  bannerRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  bannerRowStacked: { flexDirection: 'column' },
  bannerSlot: { flex: 2.4 },
  bannerSlotStacked: { flex: 0, width: '100%' },
  banner: { flex: 2.4, minHeight: 270, borderRadius: 24, backgroundColor: palette.forest, overflow: 'hidden', justifyContent: 'center' },
  bannerStacked: { flex: 0, minHeight: 240 },
  bannerCircleA: { position: 'absolute', right: -70, top: -80, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.05)' },
  bannerCircleB: { position: 'absolute', right: 120, bottom: -140, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255,255,255,0.04)' },
  bannerText: { padding: 32, width: '62%' },
  bannerTextStacked: { padding: 22, width: '66%' },
  bannerEyebrow: { fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: palette.gold, fontWeight: '600', marginBottom: spacing.sm },
  bannerTitle: { ...serif, fontSize: 44, lineHeight: 50, color: '#FBF7FF' },
  bannerTitleStacked: { fontSize: 28, lineHeight: 33 },
  bannerSub: { fontSize: 15, color: 'rgba(251,247,255,0.85)', marginTop: spacing.sm },
  bannerButton: {
    alignSelf: 'flex-start', marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 20,
    borderRadius: radius.pill, backgroundColor: '#FBF7FF',
  },
  bannerButtonText: { fontSize: 14, fontWeight: '700', color: palette.forest },
  bannerImages: { position: 'absolute', right: 16, top: 14, bottom: 6, width: '40%' },
  bannerImagesStacked: { width: '42%', right: 4, top: 30 },
  bannerImageMain: { position: 'absolute', left: '18%', right: '6%', top: 0, bottom: 0 },
  bannerImageLeft: { position: 'absolute', left: '-10%', width: '46%', height: '62%', bottom: 4, opacity: 0.9 },
  fill: { width: '100%', height: '100%' },

  offer: { flex: 1, minHeight: 0, borderRadius: 24, backgroundColor: '#43257F', padding: 24, overflow: 'hidden', justifyContent: 'center' },
  offerStacked: { flex: 0, minHeight: 200, overflow: 'hidden', paddingBottom: 32 },
  offerMobileBelow: { marginTop: spacing.md },
  offerBag: { position: 'absolute', right: -16, top: 10, opacity: 0.1 },
  offerTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  offerLabel: { fontSize: 14, color: '#FBF7FF' },
  offerUpTo: { fontSize: 22, color: '#FBF7FF', marginTop: spacing.md },
  offerBig: { fontSize: 54, lineHeight: 60, fontWeight: '800', color: '#FFFFFF' },
  offerSub: { fontSize: 14, color: 'rgba(251,247,255,0.85)', marginTop: 2 },
  offerButton: {
    alignSelf: 'flex-start', marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 8, height: 42, paddingHorizontal: 18,
    borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(251,247,255,0.7)',
  },
  offerButtonText: { fontSize: 13, fontWeight: '600', color: '#FBF7FF' },

  // Products
  section: { marginTop: spacing.xl },
  sectionTitle: { ...serif, fontSize: 26, color: palette.ink, marginBottom: spacing.md },
  sectionLoading: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyContainer: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyText: { fontSize: 14, color: palette.stone },
  browseRow: { marginTop: spacing.lg, flexDirection: 'row', justifyContent: 'flex-end' },
  browseButton: {
    flexDirection: 'row', alignItems: 'center', gap: 10, height: 54, paddingHorizontal: 26, borderRadius: radius.pill,
    backgroundColor: palette.ivory, borderWidth: 1.5, borderColor: palette.forest,
  },
  browseText: { fontSize: 15, fontWeight: '700', color: palette.forest },

  // Shop by Category cards
  shopSection: { marginTop: spacing.xl },
  shopHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  shopAccent: { width: 5, height: 30, borderRadius: 3, backgroundColor: palette.forest },
  shopTitle: { ...serif, fontSize: 26, color: palette.forest },
  shopLine: { flex: 1, height: 1, backgroundColor: palette.line },
  viewAll: { fontSize: 14, fontWeight: '700', color: palette.forest },
  shopRow: { gap: 12, paddingBottom: spacing.sm },
  shopCard: { borderRadius: 24, backgroundColor: palette.sand, overflow: 'hidden', ...softShadow('#3A1E70', 0.12, 12, 6) },
  shopImageWrap: { alignItems: 'center', justifyContent: 'center', paddingBottom: 38 },
  shopImage: { width: '78%', height: '78%' },
  shopLabel: { position: 'absolute', left: 8, right: 8, bottom: 8, height: 46, borderRadius: radius.pill, backgroundColor: palette.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 16, paddingRight: 7 },
  shopLabelText: { flex: 1, fontSize: 14, fontWeight: '700', color: palette.ink },
  shopArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: palette.forest, alignItems: 'center', justifyContent: 'center' },

  // Play & Earn promo (opens the rewards hub)
  playCard: {
    marginTop: spacing.xl,
    borderRadius: 26,
    backgroundColor: '#3A1E70',
    padding: spacing.lg,
    overflow: 'hidden',
    ...softShadow('#241540', 0.2, 24, 12),
  },
  playGlowA: { position: 'absolute', right: -60, top: -80, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(255,255,255,0.07)' },
  playGlowB: { position: 'absolute', left: -70, bottom: -120, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(242,196,90,0.14)' },
  playRing: { position: 'absolute', right: 30, bottom: -60, width: 180, height: 180, borderRadius: 90, borderWidth: 1, borderColor: 'rgba(251,247,255,0.14)' },
  playSpark: { position: 'absolute', right: 28, top: 24, opacity: 0.8 },
  playTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  playEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  playEyebrow: { fontSize: 10, letterSpacing: 2.4, textTransform: 'uppercase', fontWeight: '800', color: palette.gold },
  playPointsPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(251,247,255,0.12)',
    justifyContent: 'center',
  },
  playPointsValue: { fontSize: 14, fontWeight: '900', color: '#FBF7FF' },
  playPointsLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8, color: palette.gold },
  playTitle: { ...serif, fontSize: 28, lineHeight: 34, color: '#FBF7FF', marginTop: spacing.sm, maxWidth: 520 },
  playSub: { fontSize: 13, lineHeight: 19, color: 'rgba(251,247,255,0.82)', marginTop: 6, maxWidth: 560 },
  playActivities: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: spacing.md },
  playActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(251,247,255,0.1)',
  },
  playActivityText: { fontSize: 10, fontWeight: '700', color: '#FBF7FF' },
  playCta: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 42,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: '#FBF7FF',
  },
  playCtaText: { fontSize: 13, fontWeight: '800', color: '#3A1E70' },
  })
);