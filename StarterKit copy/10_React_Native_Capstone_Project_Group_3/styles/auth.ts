/**
 * Shared Styles for Auth Screens
 */
import { StyleSheet } from 'react-native';
import type { Palette } from '@/constants/palettes';

export const makeAuthStyles = (c: Palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingVertical: 40,
      justifyContent: 'center',
      width: '100%',
      maxWidth: 520,
      alignSelf: 'center',
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 40,
    },
    logoText: {
      fontSize: 72,
      marginBottom: 8,
    },
    appName: {
      fontSize: 32,
      fontWeight: '800',
      color: c.primary,
      letterSpacing: -0.5,
    },
    tagline: {
      fontSize: 16,
      color: c.textMuted,
      marginTop: 4,
    },
    card: {
      borderRadius: 20,
      padding: 0,
      backgroundColor: c.surface,
      borderWidth: 2,
      borderColor: c.primaryContainer,
    },
    cardContent: {
      padding: 28,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: c.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: c.textMuted,
      textAlign: 'center',
      marginBottom: 28,
    },
    input: {
      marginBottom: 16,
      backgroundColor: c.surface,
    },
    errorContainer: {
      backgroundColor: c.dangerContainer,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    errorText: {
      color: c.danger,
      fontSize: 14,
      textAlign: 'center',
    },
    loginButton: {
      marginTop: 8,
      marginBottom: 16,
      borderRadius: 8,
    },
    buttonContent: {
      paddingHorizontal: 24,
      paddingVertical: 6,
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
      color: c.primary,
      fontWeight: '500',
      textAlign: 'center',
    },
    demoHint: {
      textAlign: 'center',
    },
    registerContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 20,
    },
    registerText: {
      fontSize: 14,
      color: c.textMuted,
    },
    link: {
      paddingHorizontal: 4,
    },
    linkText: {
      fontSize: 14,
      color: c.primary,
      fontWeight: '600',
    },
    footer: {
      marginTop: 32,
      alignItems: 'center',
    },
    footerText: {
      fontSize: 12,
      color: c.textMuted,
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
      color: c.text,
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
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: 'center',
    },
    genderOptionSelected: {
      borderColor: c.primary,
      backgroundColor: c.primaryContainer,
    },
    genderOptionText: {
      fontSize: 14,
      fontWeight: '500',
      color: c.textMuted,
    },
    genderOptionTextSelected: {
      color: c.primary,
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
      color: c.textMuted,
      lineHeight: 20,
    },
    registerButton: {
      marginTop: 8,
      marginBottom: 16,
      borderRadius: 8,
    },
    loginContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 20,
    },
    loginText: {
      fontSize: 14,
      color: c.textMuted,
    },
    // Register form: each input sits in a field group with an inline HelperText below it
    fieldGroup: {
      marginBottom: 4,
    },
    fieldInput: {
      backgroundColor: c.surface,
    },
    termsError: {
      marginTop: -12,
      marginBottom: 8,
    },
    infoBanner: {
      marginTop: 4,
      marginBottom: 16,
      padding: 12,
      backgroundColor: c.primaryContainer,
      borderRadius: 8,
    },
    infoBannerText: {
      fontSize: 12,
      color: c.text,
      lineHeight: 18,
    },
  });
