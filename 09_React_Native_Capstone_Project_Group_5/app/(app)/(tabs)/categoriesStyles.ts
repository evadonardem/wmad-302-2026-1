/**
 * Categories Screen Styles
 */
import { StyleSheet } from 'react-native';
import { createStyles } from '@/context/ThemeContext';

export const styles = createStyles({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  pageTitle: { fontSize: 28, fontWeight: '700', color: '#3C252D', marginBottom: 4 },
  pageSubtitle: { fontSize: 16, color: '#8A6673', marginBottom: 16 },
  tabs: { marginBottom: 16 },
  gridWrapper: { gap: 12 },
  gridContent: { paddingBottom: 100 },
  categoryCard: { flex: 1, marginBottom: 12 },
  card: { borderRadius: 16, backgroundColor: '#FFFFFF' },
  cardContent: { padding: 20, alignItems: 'center' },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FDE7EF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: { fontSize: 16, fontWeight: '700', color: '#3C252D', textAlign: 'center', marginBottom: 4 },
  categoryCount: { fontSize: 12, color: '#8A6673' },
  tile: {
    height: 176,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#5A3A46',
    justifyContent: 'space-between',
    padding: 14,
    shadowColor: '#390518',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  tileShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(28,8,20,0.45)' },
  tileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
  tileCount: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.92)', marginTop: 2 },
  loadingBox: { paddingVertical: 60, alignItems: 'center' },
});