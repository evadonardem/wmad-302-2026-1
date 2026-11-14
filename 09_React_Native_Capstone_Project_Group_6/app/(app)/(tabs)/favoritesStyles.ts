/**
 * Favorites Screen Styles - Cookbook
 */
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8D6E63',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3E2723',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#8D6E63',
    marginTop: 8,
    textAlign: 'center',
  },
  browseButton: {
    marginTop: 24,
    borderRadius: 12,
    height: 52,
  },
  buttonContent: {
    paddingHorizontal: 32,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginHorizontal: -16,
    marginBottom: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F3E7D3',
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3E2723',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#6D4C41',
  },
  countBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E85D04',
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  favoriteCard: {
    marginBottom: 12,
  },
  card: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  recipeImage: {
    width: 88,
    height: 88,
    borderRadius: 10,
  },
  cuisineBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFF3E0',
  },
  cuisineLabel: {
    color: '#6D3A14',
    fontSize: 11,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    margin: 0,
    borderRadius: 999,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3E2723',
    marginBottom: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  details: {
    fontSize: 12,
    color: '#8D6E63',
  },
  guideContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCC80',
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E85D04',
    marginBottom: 8,
  },
  guideText: {
    fontSize: 13,
    color: '#5D4037',
    lineHeight: 20,
  },
});