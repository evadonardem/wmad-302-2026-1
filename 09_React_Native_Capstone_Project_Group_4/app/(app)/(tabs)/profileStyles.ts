/**
 * Profile Screen Styles - Shared
 */
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF8',
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
    color: '#8D6E63',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 8,
  },
  avatar: {
    marginRight: 16,
    backgroundColor: '#FFF3E0',
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3E2723',
  },
  username: {
    fontSize: 14,
    color: '#E85D04',
    fontWeight: '500',
    marginTop: 2,
  },
  email: {
    fontSize: 13,
    color: '#8D6E63',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E85D04',
  },
  statLabel: {
    fontSize: 12,
    color: '#8D6E63',
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  menuCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  divider: {
    marginLeft: 56,
  },
  logoutContainer: {
    marginTop: 24,
    marginBottom: 24,
  },
  logoutButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C62828',
    height: 52,
  },
  logoutButtonContent: {
    paddingHorizontal: 24,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C62828',
  },
  guideContainer: {
    marginTop: 16,
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
  version: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 12,
    color: '#BCAAA4',
  },
});