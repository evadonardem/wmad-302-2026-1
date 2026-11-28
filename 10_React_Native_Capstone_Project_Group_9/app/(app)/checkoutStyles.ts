import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EC',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
    fontWeight: '700',
    color: '#332F28',
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#332F28',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#332F28',
    marginBottom: 12,
  },
  itemCard: {
    marginBottom: 8,
    backgroundColor: '#FFFEFA',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemTitle: {
    flex: 1,
    fontSize: 14,
    color: '#332F28',
  },
  itemPrice: {
    fontWeight: '700',
    color: '#332F28',
  },
  card: {
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: '#FFFEFA',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 12,
  },
  summaryLabel: {
    color: '#625B50',
    fontSize: 14,
  },
  summaryValue: {
    color: '#332F28',
    fontSize: 14,
    fontWeight: '600',
  },
  discountValue: {
    color: '#708066',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#DED8CB',
    marginVertical: 8,
  },
  totalLabel: {
    color: '#332F28',
    fontSize: 17,
    fontWeight: '700',
  },
  totalValue: {
    color: '#708066',
    fontSize: 20,
    fontWeight: '700',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingRight: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DED8CB',
    backgroundColor: '#FFFEFA',
  },
  selectedAddressCard: {
    borderColor: '#708066',
    backgroundColor: '#E5E9DD',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingRight: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DED8CB',
    backgroundColor: '#FFFEFA',
  },
  selectedPaymentOption: {
    borderColor: '#708066',
    backgroundColor: '#E5E9DD',
  },
  paymentDetails: {
    flex: 1,
    paddingVertical: 10,
  },
  addressDetails: {
    flex: 1,
    paddingVertical: 10,
  },
  addressTitle: {
    color: '#332F28',
    fontWeight: '700',
    marginBottom: 4,
  },
  addressText: {
    color: '#625B50',
    fontSize: 13,
    lineHeight: 19,
  },
  addAddressButton: {
    marginTop: 8,
    marginBottom: 20,
  },
  placeOrderButton: {
    minHeight: 50,
    justifyContent: 'center',
  },
  demoNotice: {
    marginTop: 12,
    textAlign: 'center',
    color: '#625B50',
    fontSize: 12,
  },
  errorText: {
    marginVertical: 12,
    color: '#A66A5C',
    fontSize: 14,
  },
  mutedText: {
    marginVertical: 10,
    color: '#625B50',
    fontSize: 15,
    textAlign: 'center',
  },
  successIcon: {
    width: 60,
    height: 60,
    textAlign: 'center',
    textAlignVertical: 'center',
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#E6F4EA',
    color: '#708066',
    fontSize: 38,
    fontWeight: '700',
    marginBottom: 18,
  },
  confirmationTotal: {
    marginTop: 12,
    color: '#708066',
    fontSize: 21,
    fontWeight: '700',
  },
  confirmationButton: {
    marginTop: 24,
    marginBottom: 8,
  },
  dialogScrollArea: {
    maxHeight: 440,
  },
  addressInput: {
    marginBottom: 10,
  },
  defaultAddressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
});
