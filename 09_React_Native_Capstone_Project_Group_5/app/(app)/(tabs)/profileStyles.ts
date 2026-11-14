/**
 * Profile Screen Styles - Shared
 */
import { createStyles } from '@/context/ThemeContext';

export const styles = createStyles({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 120, maxWidth: 720, width: '100%', alignSelf: 'center' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notLoggedIn: { fontSize: 16, color: '#8A6673' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingVertical: 8 },
  avatar: { marginRight: 16, backgroundColor: '#D81B60' },
  nameContainer: { flex: 1 },
  name: { fontSize: 24, fontWeight: '700', color: '#3C252D' },
  username: { fontSize: 14, color: '#D81B60', fontWeight: '500', marginTop: 2 },
  email: { fontSize: 13, color: '#8A6673', marginTop: 2 },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FDE7EF',
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 24,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: '#D81B60' },
  statLabel: { fontSize: 12, color: '#8A6673', marginTop: 4 },
  section: { marginBottom: 16 },
  menuCard: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E9CED8' },
  divider: { marginLeft: 56 },
  menuIcon: { marginLeft: 16, alignSelf: 'center' },
  logoutContainer: { marginTop: 8, marginBottom: 16 },
  logoutButton: { borderRadius: 12, borderColor: '#C62828', borderWidth: 1.5, backgroundColor: '#FFFFFF' },
  version: { alignItems: 'center', paddingVertical: 16 },
  versionText: { fontSize: 12, color: '#BAA6AD' },
});