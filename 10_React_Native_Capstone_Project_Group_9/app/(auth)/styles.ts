/**
 * Shared Styles for Auth Screens
 */
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EC',
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
    color: '#708066',
    fontFamily: 'Georgia',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: '#625B50',
    marginTop: 4,
  },
  card: {
    borderRadius: 18,
    padding: 0,
    backgroundColor: '#FFFEFA',
    borderWidth: 1,
    borderColor: '#E4DFD2',
  },
  cardContent: {
    padding: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#332F28',
    fontFamily: 'Georgia',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#625B50',
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
    backgroundColor: '#FCE8E6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#A66A5C',
    fontSize: 14,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 8,
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
    color: '#708066',
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
    color: '#625B50',
  },
  link: {
    paddingHorizontal: 4,
  },
  linkText: {
    fontSize: 14,
    color: '#708066',
    fontWeight: '600',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#625B50',
    textAlign: 'center',
    lineHeight: 18,
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
  },
  genderSelector: {
    justifyContent: 'center',
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#332F28',
    marginBottom: 8,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DED8CB',
    backgroundColor: '#FFFEFA',
    alignItems: 'center',
  },
  genderOptionSelected: {
    borderColor: '#708066',
    backgroundColor: '#E5E9DD',
  },
  genderOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#625B50',
  },
  genderOptionTextSelected: {
    color: '#708066',
    fontWeight: '600',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    marginRight: 4,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#625B50',
    lineHeight: 20,
  },
  registerButton: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 8,
    height: 52,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: '#625B50',
  },
});