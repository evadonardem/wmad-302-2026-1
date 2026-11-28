/**
 * Cart screen styles - NextDoorFinds
 */
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EC',
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#332F28',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#625B50',
    marginTop: 8,
    textAlign: 'center',
  },
  browseButton: {
    marginTop: 24,
    borderRadius: 8,
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
    paddingTop: 16,
    paddingBottom: 300,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#332F28',
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFEFA',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F1EEE5',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#332F28',
    marginBottom: 4,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  itemCurrentPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#708066',
  },
  itemOriginalPrice: {
    fontSize: 13,
    color: '#9E9E9E',
    textDecorationLine: 'line-through',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#332F28',
    minWidth: 30,
    textAlign: 'center',
  },
  separator: {
    height: 8,
  },
  summaryContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FBF9F3',
    borderTopWidth: 1,
    borderTopColor: '#DED8CB',
    padding: 20,
    paddingBottom: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#625B50',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#332F28',
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#708066',
  },
  summaryRowDivider: {
    height: 1,
    backgroundColor: '#DED8CB',
    marginVertical: 12,
  },
  summaryRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryLabelTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#332F28',
  },
  summaryValueTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#708066',
  },
  checkoutButton: {
    borderRadius: 8,
    height: 52,
  },
  couponContainer: {
    marginTop: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#FFFEFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DED8CB',
  },
  couponTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#332F28',
  },
  couponHelp: {
    marginTop: 4,
    fontSize: 12,
    color: '#625B50',
  },
  couponInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  couponInput: {
    flex: 1,
    backgroundColor: '#FFFEFA',
  },
  errorText: {
    marginTop: 8,
    color: '#D93025',
    fontSize: 13,
  },
  demoNotice: {
    marginTop: 12,
    color: '#625B50',
    fontSize: 13,
  },
});