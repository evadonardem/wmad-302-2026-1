import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF8',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  headerText: {
    flex: 1,
    marginLeft: 4,
  },
  title: {
    color: '#3E2723',
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    color: '#8D6E63',
    fontSize: 13,
    marginTop: 2,
  },
  hero: {
    backgroundColor: '#E85D04',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  heroContent: {
    padding: 22,
  },
  heroIcon: {
    alignSelf: 'flex-start',
    backgroundColor: '#F98B43',
    marginBottom: 12,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  heroText: {
    color: '#FFF3E0',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  heroButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    backgroundColor: '#FFFFFF',
  },
  heroButtonText: {
    color: '#E85D04',
  },
  formCard: {
    borderRadius: 18,
    marginBottom: 20,
  },
  formTitle: {
    color: '#3E2723',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  formHint: {
    color: '#8D6E63',
    fontSize: 13,
    marginBottom: 14,
  },
  input: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
  },
  inputLarge: {
    minHeight: 100,
  },
  error: {
    color: '#C62828',
    fontSize: 13,
    marginTop: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
  },
  sectionTitle: {
    color: '#3E2723',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  recipeCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  recipeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  recipeIcon: {
    backgroundColor: '#FFF3E0',
    marginRight: 14,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    color: '#3E2723',
    fontSize: 16,
    fontWeight: '700',
  },
  recipeMeta: {
    color: '#8D6E63',
    fontSize: 13,
    marginTop: 5,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 42,
  },
  emptyTitle: {
    color: '#3E2723',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  emptyText: {
    color: '#8D6E63',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
});
