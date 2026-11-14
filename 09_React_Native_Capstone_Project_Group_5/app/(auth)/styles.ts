/**
 * Shared Styles for Auth Screens
 */
import { createStyles } from '@/context/ThemeContext';

export const styles = createStyles({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF8',
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 54,
  },
  appName: {
    fontSize: 38,
    fontWeight: '800',
    color: '#3E2723',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: '#8D6E63',
    marginTop: 4,
  },
  card: {
    borderRadius: 28,
    padding: 0,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3E3D3',
  },
  cardContent: {
    padding: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3E2723',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8D6E63',
    textAlign: 'center',
    marginBottom: 28,
  },
  input: {
    marginBottom: 16,
  },
  eyeIcon: {
    padding: 8,
  },
  eyeText: {
    fontSize: 20,
  },
  errorContainer: {
    backgroundColor: '#FDEDED',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 12,
    height: 52,
  },
  buttonContent: {
    paddingHorizontal: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
    color: '#8D6E63',
  },
  link: {
    paddingHorizontal: 4,
  },
  linkText: {
    fontSize: 14,
    color: '#E85D04',
    fontWeight: '600',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#8D6E63',
    textAlign: 'center',
    lineHeight: 18,
  },

  /* ---- Login screen extras ---- */
  lgBadgeArea: { width: 190, height: 150, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  lgBadgeRing: { width: 124, height: 124, borderRadius: 62, backgroundColor: '#FFE3C7', alignItems: 'center', justifyContent: 'center' },
  lgBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#E85D04',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lgFloater: { position: 'absolute', fontSize: 30 },
  lgFloatTL: { top: 6, left: 8, transform: [{ rotate: '-14deg' }] },
  lgFloatTR: { top: 0, right: 10 },
  lgFloatBL: { bottom: 6, left: 14 },
  lgFloatBR: { bottom: 10, right: 6 },
  lgAppNameAccent: { color: '#E85D04' },
  lgPerks: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' },
  lgPerk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3E3D3',
  },
  lgPerkText: { fontSize: 12, fontWeight: '700', color: '#6D4C41' },
  lgCardStripe: { height: 6, backgroundColor: '#E85D04' },
  lgInputOutline: { borderRadius: 16 },
  lgLoginButton: { marginTop: 8, marginBottom: 8, borderRadius: 26, height: 54, justifyContent: 'center' },
  lgFooterEmoji: { fontSize: 22, letterSpacing: 6, marginBottom: 10 },

  /* ---- Register screen ---- */
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionalRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  halfInput: {
    flex: 1,
  },
  genderSelector: {
    marginBottom: 16,
  },
  genderLabel: {
    fontSize: 12,
    color: '#8D6E63',
    marginBottom: 6,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BCAAA4',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  genderOptionSelected: {
    backgroundColor: '#E85D04',
    borderColor: '#E85D04',
  },
  genderOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5D4037',
  },
  genderOptionTextSelected: {
    color: '#FFFFFF',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    marginRight: 4,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#5D4037',
    lineHeight: 18,
  },
  registerButton: {
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    height: 52,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  loginText: {
    fontSize: 14,
    color: '#8D6E63',
  },
});