import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EC',
  },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    backgroundColor: '#FBF9F3',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DED8CB',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#332F28',
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    paddingBottom: 32,
  },
  gallery: {
    backgroundColor: '#FFFEFA',
  },
  mainImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#F1EEE5',
  },
  thumbnailList: {
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DED8CB',
    backgroundColor: '#FFFEFA',
  },
  selectedThumbnail: {
    borderColor: '#708066',
    borderWidth: 2,
  },
  productInfo: {
    padding: 20,
    backgroundColor: '#FFFEFA',
  },
  category: {
    color: '#708066',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
    marginBottom: 6,
  },
  title: {
    color: '#332F28',
    fontSize: 24,
    fontWeight: '700',
  },
  brand: {
    color: '#625B50',
    fontSize: 14,
    marginTop: 6,
  },
  rating: {
    color: '#625B50',
    fontSize: 14,
    marginTop: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  price: {
    color: '#708066',
    fontSize: 26,
    fontWeight: '700',
  },
  originalPrice: {
    color: '#9E9E9E',
    fontSize: 16,
    textDecorationLine: 'line-through',
  },
  discount: {
    color: '#708066',
    fontSize: 14,
    fontWeight: '600',
  },
  stock: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  inStock: {
    color: '#708066',
  },
  outOfStock: {
    color: '#D93025',
  },
  purchaseBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FBF9F3',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DED8CB',
  },
  purchaseButton: {
    flex: 1,
    borderRadius: 8,
  },
  section: {
    padding: 20,
    marginBottom: 12,
    backgroundColor: '#FFFEFA',
  },
  sectionTitle: {
    color: '#332F28',
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 14,
  },
  description: {
    color: '#625B50',
    fontSize: 15,
    lineHeight: 23,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DED8CB',
  },
  detailLabel: {
    flex: 1,
    color: '#625B50',
    fontSize: 14,
  },
  detailValue: {
    flex: 1.5,
    color: '#332F28',
    fontSize: 14,
    textAlign: 'right',
  },
  review: {
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DED8CB',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  reviewerName: {
    flex: 1,
    color: '#332F28',
    fontSize: 15,
    fontWeight: '600',
  },
  reviewDate: {
    color: '#80868B',
    fontSize: 12,
  },
  reviewRating: {
    color: '#F9AB00',
    fontSize: 14,
    marginTop: 6,
  },
  reviewComment: {
    color: '#625B50',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  stateContainer: {
    flex: 1,
    backgroundColor: '#F7F4EC',
  },
  stateText: {
    color: '#625B50',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  errorText: {
    color: '#D93025',
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 24,
    marginTop: 48,
  },
  retryButton: {
    alignSelf: 'center',
    marginTop: 20,
  },
});
