/**
 * Profile Screen Styles - Shared
 */
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EC',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 120,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notLoggedIn: {
    fontSize: 16,
    color: '#625B50',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 8,
  },
  avatar: {
    marginRight: 16,
    backgroundColor: '#E5E9DD',
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#332F28',
    fontFamily: 'Georgia',
  },
  username: {
    fontSize: 14,
    color: '#708066',
    fontWeight: '500',
    marginTop: 2,
  },
  email: {
    fontSize: 13,
    color: '#625B50',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#E9E4D7',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DED8CB',
    paddingVertical: 20,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#708066',
  },
  statLabel: {
    fontSize: 12,
    color: '#625B50',
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  menuCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFEFA',
    borderWidth: 1,
    borderColor: '#E4DFD2',
  },
  divider: {
    marginLeft: 56,
  },
  logoutContainer: {
    marginTop: 24,
    marginBottom: 24,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#E9E4D7',
    borderWidth: 1,
    borderColor: '#DED8CB',
  },
  logoutButton: {
    borderRadius: 12,
    height: 50,
    backgroundColor: '#708066',
  },
  logoutButtonContent: {
    paddingHorizontal: 24,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  version: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 12,
    color: '#A99C88',
  },
  dialog: {
    maxHeight: '90%',
  },
  dialogScrollArea: {
    paddingHorizontal: 0,
  },
  form: {
    gap: 12,
    paddingVertical: 8,
  },
  formError: {
    color: '#D93025',
    fontSize: 13,
    marginTop: 12,
  },
  helperText: {
    color: '#625B50',
    fontSize: 13,
    lineHeight: 19,
  },
  orderCard: {
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardActions: {
    flexDirection: 'row',
  },
  rowTitle: {
    color: '#332F28',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  orderTotal: {
    color: '#708066',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  orderProduct: {
    color: '#625B50',
    fontSize: 13,
    marginTop: 4,
  },
});