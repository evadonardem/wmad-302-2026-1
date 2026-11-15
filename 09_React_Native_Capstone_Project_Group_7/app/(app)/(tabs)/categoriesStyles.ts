/**
 * Categories Screen Styles
 */
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF8',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3E2723',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#8D6E63',
    marginBottom: 20,
  },
  gridWrapper: {
    justifyContent: 'space-between',
  },
  gridContent: {
    paddingBottom: 20,
  },
  categoryCard: {
    width: '48%',
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    height: '100%',
  },
  cardContent: {
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3E2723',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
    color: '#8D6E63',
  },
  separator: {
    height: 8,
    width: '100%',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#C62828',
    textAlign: 'center',
  },
  guideContainer: {
    marginTop: 24,
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