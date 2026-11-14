/**
 * Shared Styles for Auth Screens
 */
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
  },
  optionalRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  genderSelector: {
    justifyContent: 'center',
  },
  genderLabel: {
    color: '#8D6E63',
    marginBottom: 4,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 4,
  },
  genderOption: {
    borderWidth: 1,
    borderColor: '#D7CCC8',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  genderOptionSelected: {
    backgroundColor: '#FFF3E0',
    borderColor: '#E85D04',
  },
  genderOptionText: {
    color: '#8D6E63',
    fontSize: 12,
  },
  genderOptionTextSelected: {
    color: '#E85D04',
    fontWeight: '700',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  checkbox: {
    margin: 0,
  },
  termsText: {
    flex: 1,
    color: '#8D6E63',
    fontSize: 13,
  },
  registerButton: {
    marginTop: 8,
    borderRadius: 12,
    height: 52,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#8D6E63',
    fontSize: 14,
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
});