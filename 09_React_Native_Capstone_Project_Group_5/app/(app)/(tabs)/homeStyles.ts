/**
 * Home Screen Styles - Cookbook
 */
import { StyleSheet } from 'react-native';
import { createStyles } from '@/context/ThemeContext';

export const styles = createStyles({
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Space for tab bar
    maxWidth: 1240,
    width: '100%',
    alignSelf: 'center',
  },

  // Hero banner
  hero: {
    position: 'relative',
    zIndex: 20, // sits above the category pills so the search dropdown can overlap them
    borderRadius: 28,
    marginTop: 12,
    minHeight: 320,
    justifyContent: 'center',
  },
  heroClip: { ...StyleSheet.absoluteFillObject, borderRadius: 28, overflow: 'hidden', backgroundColor: '#3E2723' },
  themeToggle: { position: 'absolute', top: 12, right: 12, zIndex: 30, margin: 0 },
  heroNarrow: { minHeight: 380 },
  // Dish name under the search box (phones)
  heroDish: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch', marginTop: 12, marginBottom: 14, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 18, backgroundColor: 'rgba(20,10,5,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  heroDishText: { flex: 1 },
  heroDishName: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  heroDishSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  scrimFlat: { backgroundColor: 'rgba(20,10,5,0.55)' },
  heroText: { padding: 28, maxWidth: 620, justifyContent: 'center', zIndex: 2 },
  heroGreeting: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 40,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 2 },
  },
  heroTitleWide: { fontSize: 46, lineHeight: 56 },
  heroAccent: { color: '#FFA726' },
  cookAccent: { color: '#E85D04' },

  // "What to cook?"
  cookTitle: { fontSize: 28, fontWeight: '800', color: '#2B2320', textAlign: 'center', marginTop: 36, marginBottom: 18 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 28 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6D6C4',
  },
  pillSelected: { backgroundColor: '#2B2320', borderColor: '#2B2320' },
  pillText: { fontSize: 14, fontWeight: '600', color: '#3E2723' },
  pillTextSelected: { color: '#FFFFFF' },

  // Grid
  gridRow: { marginHorizontal: -8 },
  gridCell: { padding: 8 },
  resultCount: { fontSize: 13, color: '#8D6E63', marginBottom: 8, marginLeft: 8 },

  // Pagination bar
  pager: { alignItems: 'center', gap: 12, paddingTop: 20, paddingBottom: 12 },
  pagerInfo: { fontSize: 13, color: '#8D6E63' },
  pagerRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pageBtn: { minWidth: 42, height: 42, paddingHorizontal: 6, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E6D6C4' },
  pageBtnActive: { backgroundColor: '#E85D04', borderColor: '#E85D04' },
  pageBtnOff: { opacity: 0.4 },
  pageText: { fontSize: 15, fontWeight: '700', color: '#3E2723' },
  pageTextActive: { color: '#FFFFFF' },
  pageGap: { fontSize: 16, color: '#8D6E63', paddingHorizontal: 2 },
  footer: { paddingVertical: 20, alignItems: 'center' },
  seeAllText: { fontSize: 14, fontWeight: '600', color: '#E85D04' },
  endText: { fontSize: 13, color: '#8D6E63' },
});