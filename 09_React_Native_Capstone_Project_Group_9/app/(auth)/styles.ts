import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF8',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 64,
    marginBottom: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#E85D04',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: '#8D6E63',
    marginTop: 4,
  },
  card: {
    borderRadius: 16,
    padding: 0,
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
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  halfInput: {
    flex: 1,
  },
  optionalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  genderSelector: {
    borderWidth: 1,
    borderColor: '#D7CCC8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFDF8',
  },
  genderLabel: {
    fontSize: 12,
    color: '#8D6E63',
    marginBottom: 6,
  },
  genderOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  genderOptionSelected: {
    backgroundColor: '#FFF3E0',
  },
  genderOptionText: {
    fontSize: 13,
    color: '#3E2723',
    fontWeight: '600',
  },
  genderOptionTextSelected: {
    color: '#E85D04',
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
  registerButton: {
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
  demoContainer: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
  },
  demoButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  demoButtonText: {
    fontSize: 14,
    color: '#E85D04',
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginRoot: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
    color: '#8D6E63',
  },
  loginText: {
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  checkbox: {
    marginRight: 8,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#5D4037',
    lineHeight: 18,
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
  loginContainer: {
    backgroundColor: '#343C83',
    overflow: 'hidden',
  },
  loginBackgroundImage: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    left: '-10%',
    top: '-10%',
    opacity: 0.42,
  },
  loginScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 26,
  },
  loginContent: {
    width: '100%',
    maxWidth: 470,
    alignItems: 'center',
  },
  loginLogoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loginLogoBadge: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
  },
  loginLogoText: {
    fontSize: 39,
  },
  loginAppName: {
    fontFamily: 'serif',
    fontSize: 31,
    fontWeight: '800',
    color: '#111111',
    letterSpacing: 1,
  },
  loginTagline: {
    fontSize: 14,
    color: '#111111',
    marginTop: 3,
  },
  loginCardGradient: {
    width: '100%',
    maxWidth: 470,
    borderRadius: 22,
    padding: 3,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#642B63',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },
  loginCard: {
    width: '100%',
    borderRadius: 19,
    backgroundColor: '#F0FBFA',
  },
  loginCardContent: {
    paddingHorizontal: 22,
    paddingVertical: 23,
  },
  loginTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#272B56',
    textAlign: 'center',
    marginBottom: 4,
  },
  loginTitleSail: {
    fontFamily: 'Sail',
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '400',
  },
  loginSubtitle: {
    fontSize: 13,
    color: '#767B9C',
    textAlign: 'center',
    marginBottom: 21,
  },
  loginInput: {
    marginBottom: 13,
    backgroundColor: '#FFFFFF',
  },
  loginButtonGradient: {
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 10,
    overflow: 'hidden',
  },
  loginPrimaryButton: {
    margin: 0,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.35,
  },
  loginDivider: {
    marginVertical: 12,
    backgroundColor: '#E4E6F1',
  },
  loginDemoButtonText: {
    color: '#6851C7',
    fontSize: 13,
    fontWeight: '700',
  },
  loginDemoDetails: {
    color: '#9296AE',
    fontSize: 11,
    marginTop: 3,
  },
  loginRegisterText: {
    color: '#737895',
    fontSize: 13,
  },
  loginLinkText: {
    color: '#B43C9E',
    fontSize: 13,
    fontWeight: '700',
  },
  loginFooter: {
    maxWidth: 360,
    alignItems: 'center',
    marginTop: 16,
  },
  loginFooterText: {
    fontSize: 11,
    color: '#111111',
    textAlign: 'center',
    lineHeight: 16,
  },
});

