/**
 * Shared Styles for Auth Screens
 */
import { StyleSheet } from 'react-native';
import { fontFamily, makeStyles } from '@/constants/theme';

export const useAuthStyles = makeStyles((c) =>
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
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 40,
    },
    logoText: {
      fontFamily: fontFamily.regular,
      fontSize: 64,
      marginBottom: 8,
    },
    appName: {
      fontFamily: fontFamily.display,
      fontSize: 32,
      color: c.primary,
      letterSpacing: -0.5,
    },
    tagline: {
      fontFamily: fontFamily.regular,
      fontSize: 16,
      color: c.muted,
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
      fontFamily: fontFamily.display,
      fontSize: 24,
      color: c.onSurface,
      textAlign: 'center',
      marginBottom: 4,
    },
    subtitle: {
      fontFamily: fontFamily.regular,
      fontSize: 14,
      color: c.muted,
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
      fontFamily: fontFamily.regular,
      fontSize: 20,
    },
    errorContainer: {
      backgroundColor: c.errorContainer,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    errorText: {
      fontFamily: fontFamily.regular,
      color: c.error,
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
      fontFamily: fontFamily.semibold,
      color: c.onPrimary,
      fontSize: 16,
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
      fontFamily: fontFamily.medium,
      fontSize: 14,
      color: c.primary,
    },
    registerContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 20,
    },
    registerText: {
      fontFamily: fontFamily.regular,
      fontSize: 14,
      color: c.muted,
    },
    link: {
      paddingHorizontal: 4,
    },
    linkText: {
      fontFamily: fontFamily.semibold,
      fontSize: 14,
      color: c.primary,
    },
    footer: {
      marginTop: 32,
      alignItems: 'center',
    },
    footerText: {
      fontFamily: fontFamily.regular,
      fontSize: 12,
      color: c.muted,
      textAlign: 'center',
      lineHeight: 18,
    },

    // Register screen
    nameRow: {
      flexDirection: 'row',
      gap: 12,
    },
    halfInput: {
      flex: 1,
    },
    optionalRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    genderSelector: {
      marginBottom: 16,
    },
    genderLabel: {
      fontFamily: fontFamily.regular,
      fontSize: 12,
      color: c.muted,
      marginBottom: 6,
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
      borderColor: c.outline,
      alignItems: 'center',
    },
    genderOptionSelected: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    genderOptionText: {
      fontFamily: fontFamily.regular,
      fontSize: 13,
      color: c.onSurfaceVariant,
    },
    genderOptionTextSelected: {
      color: c.onPrimary,
      fontFamily: fontFamily.semibold,
    },
    termsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    termsText: {
      fontFamily: fontFamily.regular,
      flex: 1,
      fontSize: 13,
      color: c.onSurfaceVariant,
    },
    registerButton: {
      marginTop: 8,
      marginBottom: 16,
      borderRadius: 12,
      height: 52,
    },
    loginContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 8,
    },
    loginText: {
      fontFamily: fontFamily.regular,
      fontSize: 14,
      color: c.muted,
    },
  })
);
