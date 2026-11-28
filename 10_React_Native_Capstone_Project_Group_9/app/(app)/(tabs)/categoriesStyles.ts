/**
 * Categories Screen Styles
 */
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EC',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#332F28',
    fontFamily: 'Georgia',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#625B50',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#332F28',
    fontFamily: 'Georgia',
    marginTop: 12,
    marginBottom: 10,
  },
  chipList: {
    gap: 8,
    paddingBottom: 8,
    paddingRight: 8,
  },
  departmentChip: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFEFA',
    borderWidth: 1,
    borderColor: '#DED8CB',
  },
  departmentChipSelected: {
    backgroundColor: '#708066',
    borderColor: '#708066',
  },
  departmentChipText: {
    color: '#625B50',
    fontSize: 13,
    fontWeight: '600',
  },
  departmentChipTextSelected: {
    color: '#FFFFFF',
  },
  brandCard: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFEFA',
    borderWidth: 1,
    borderColor: '#DED8CB',
  },
  brandName: {
    color: '#332F28',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyBrands: {
    paddingVertical: 12,
    color: '#625B50',
    fontSize: 14,
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
    backgroundColor: '#FFFEFA',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E4DFD2',
  },
  categoryBanner: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E9E4D7',
  },
  categoryImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.72,
  },
  cardContent: {
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 14,
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#332F28',
    fontFamily: 'Georgia',
    textAlign: 'center',
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 12,
    color: '#625B50',
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
    color: '#625B50',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#A66A5C',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#708066',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});