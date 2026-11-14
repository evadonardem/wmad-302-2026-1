
/**
 * Shared Styles for Auth Screens
 */
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // ORIGINAL SHARED STYLES
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
  },
  optionalRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  halfInput: {
    flex: 1,
    minWidth: 0,
  },
  genderSelector: {
    marginBottom: 16,
  },
  genderLabel: {
    color: '#5D4037',
    fontSize: 14,
    marginBottom: 8,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D7CCC8',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderOptionSelected: {
    backgroundColor: '#FFF0E5',
    borderColor: '#E85D04',
  },
  genderOptionText: {
    color: '#8D6E63',
    fontSize: 13,
    fontWeight: '500',
  },
  genderOptionTextSelected: {
    color: '#E85D04',
    fontWeight: '700',
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  checkbox: {
    marginRight: 4,
  },
  termsText: {
    flex: 1,
    color: '#5D4037',
    fontSize: 13,
    lineHeight: 20,
  },
  registerButton: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    backgroundColor: '#E85D04',
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
    color: '#FFFFFF',
  },

  // KEEP THIS FOR REGISTER SCREEN
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 20,
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
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
    color: '#8D6E63',
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
  guideContainer: {
    backgroundColor: '#FFF3E8',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8D3B00',
    marginBottom: 8,
  },
  guideText: {
    fontSize: 13,
    color: '#8D6E63',
    lineHeight: 21,
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

  // LOGIN PAGE - MODERN CULINARY EDITORIAL
  loginScreenContainer: {
    flex: 1,
    backgroundColor: '#F5F3EA',
  },

  // Updated scroll layout
  loginScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 35,
    paddingHorizontal: 20,
  },

  loginPage: {
    width: '100%',
    maxWidth: 1050,
    alignSelf: 'center',
  },

  loginBrand: {
    alignItems: 'center',
    marginBottom: 25,
  },
  loginBrandIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#24543D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  loginBrandEmoji: {
    fontSize: 25,
  },
  loginBrandName: {
    color: '#24543D',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 3,
  },
  loginBrandTagline: {
    color: '#8A9688',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 5,
  },

  // Updated responsive login panel
  loginPanel: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    overflow: 'hidden',
    flexDirection: 'row',
    elevation: 5,
    shadowColor: '#243D2C',
    shadowOpacity: 0.10,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },

  // Green hero section
  loginHero: {
    flex: 1,
    minHeight: 550,
    backgroundColor: '#24543D',
    paddingHorizontal: 38,
    paddingVertical: 38,
    justifyContent: 'space-between',
    alignItems: 'stretch',
    overflow: 'hidden',
    position: 'relative',
  },

  loginHeroText: {
    zIndex: 2,
  },
  loginEyebrow: {
    color: '#D5B77A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 20,
  },
  loginHeroTitle: {
    color: '#FFFFFF',
    fontSize: 39,
    fontWeight: '900',
    lineHeight: 46,
    letterSpacing: -1,
  },
  loginHeroAccent: {
    color: '#E4C68E',
    fontStyle: 'italic',
  },
  loginHeroSubtitle: {
    color: '#D7E2D7',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 18,
    maxWidth: 230,
  },

  // Food illustration
  loginFoodCircle: {
    width: 155,
    height: 155,
    borderRadius: 78,
    backgroundColor: '#F1E9D8',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 20,
    zIndex: 2,
  },
  loginFoodEmoji: {
    fontSize: 85,
  },

  // Decorative background circle
  loginSmallCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#35664B',
    top: -85,
    right: -90,
  },

  // White login form
  loginForm: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 35,
    paddingVertical: 40,
    justifyContent: 'center',
  },

  loginTitle: {
    fontSize: 29,
    fontWeight: '900',
    color: '#263B2D',
    letterSpacing: -0.8,
  },
  loginSubtitle: {
    color: '#879187',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
    marginBottom: 28,
  },
  loginFieldLabel: {
    color: '#526A57',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 8,
  },
  loginInput: {
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    marginBottom: 12,
    height: 54,
  },
  loginInputOutline: {
    borderRadius: 12,
  },

  // Sign in button
  loginSubmit: {
    height: 54,
    borderRadius: 12,
    backgroundColor: '#24543D',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 20,
  },
  loginSubmitDisabled: {
    opacity: 0.65,
  },
  loginSubmitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  loginSubmitArrow: {
    color: '#E4C68E',
    fontSize: 23,
    fontWeight: '700',
    marginLeft: 12,
  },

  // Demo account
  loginDemo: {
    backgroundColor: '#F5F3EA',
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
    alignItems: 'center',
  },
  loginDemoTitle: {
    color: '#24543D',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  loginDemoText: {
    color: '#7E897D',
    fontSize: 11,
    marginTop: 7,
    textAlign: 'center',
  },

  // Sign up
  loginSignup: {
    alignItems: 'center',
    marginTop: 25,
    gap: 8,
  },
  loginSignupText: {
    color: '#879187',
    fontSize: 12,
  },
  loginSignupLink: {
    color: '#24543D',
    fontSize: 13,
    fontWeight: '800',
  },

  // Error message
  loginError: {
    backgroundColor: '#FCECEA',
    borderRadius: 9,
    padding: 12,
    marginTop: 5,
    marginBottom: 8,
  },
  loginErrorText: {
    color: '#B83232',
    fontSize: 12,
    textAlign: 'center',
  },

  // Footer
  loginFooter: {
    color: '#9BA397',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: 24,
  },
});
