import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF6F0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF6F0',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#7A6258',
  },
  listContent: {
    width: '100%',
    maxWidth: 820,
    alignSelf: 'center',
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2D1B14',
  },
  favoriteCard: {
    borderRadius: 18,
  },
  card: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    gap: 14,
  },
  recipeImage: {
    width: 105,
    height: 105,
    borderRadius: 14,
    backgroundColor: '#EFE6DD',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2D1B14',
    marginBottom: 6,
  },
  meta: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  difficultyChip: {
    backgroundColor: '#E8F5E9',
  },
  cuisineChip: {
    backgroundColor: '#FFF3E0',
  },
  details: {
    fontSize: 13,
    color: '#7A6258',
  },
  separator: {
    height: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D1B14',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#7A6258',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 320,
  },
  browseButton: {
    marginTop: 20,
    backgroundColor: '#E85D04',
    borderRadius: 12,
  },
  buttonContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
});
