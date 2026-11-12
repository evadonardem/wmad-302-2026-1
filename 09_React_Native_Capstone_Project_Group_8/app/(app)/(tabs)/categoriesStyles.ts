
/**
 * Categories Screen Styles
 * Green and White Cookbook Theme
 */

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FAF3',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },

  header: {
    marginBottom: 20,
  },

  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 4,
  },

  pageSubtitle: {
    fontSize: 15,
    color: '#668064',
    marginBottom: 14,
  },

  headerBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },

  headerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },

  gridWrapper: {
    justifyContent: 'space-between',
  },

  gridContent: {
    paddingBottom: 24,
  },

  categoryCard: {
    width: '48%',
    marginBottom: 12,
  },

  card: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    height: '100%',
    overflow: 'hidden',
  },

  cardContent: {
    paddingHorizontal: 12,
    paddingVertical: 20,
    alignItems: 'center',
  },

  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B5E20',
    textAlign: 'center',
    marginBottom: 4,
  },

  categoryCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#668064',
    marginBottom: 12,
  },

  exploreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#F1F8EE',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  exploreText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
  },

  separator: {
    height: 4,
    width: '100%',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FAF3',
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#668064',
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#F5FAF3',
  },

  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B5E20',
    textAlign: 'center',
    marginTop: 12,
  },

  errorSubtext: {
    fontSize: 13,
    color: '#668064',
    textAlign: 'center',
    marginTop: 8,
  },

  retryButton: {
    backgroundColor: '#43A52F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 18,
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  guideContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C8DFC2',
  },

  guideTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 8,
  },

  guideText: {
    fontSize: 13,
    color: '#426B40',
    lineHeight: 20,
  },
});
