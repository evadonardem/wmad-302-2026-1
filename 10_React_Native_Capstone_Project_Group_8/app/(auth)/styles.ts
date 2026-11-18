
/**
 * Shared Dynamic Styles for Authentication Screens
 *
 * Supports both Light and Dark themes using React Native Paper.
 */

import { StyleSheet } from 'react-native';
import type { MD3Theme } from 'react-native-paper';

export const createAuthStyles = (theme: MD3Theme) => {
  const colors = theme.colors;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingVertical: 40,
      justifyContent: 'center',
      backgroundColor: colors.background,
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
      color: colors.primary,
      letterSpacing: -0.5,
    },

    tagline: {
      fontSize: 16,
      color: colors.onSurfaceVariant,
      marginTop: 4,
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 0,
    },

    cardContent: {
      padding: 28,
    },

    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.onSurface,
      textAlign: 'center',
      marginBottom: 4,
    },

    subtitle: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
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
      backgroundColor: colors.errorContainer,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.error,
    },

    errorText: {
      color: colors.onErrorContainer,
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
      color: colors.onPrimary,
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
      color: colors.primary,
      fontWeight: '500',
    },

    registerContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 20,
    },

    registerText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },

    link: {
      paddingHorizontal: 4,
    },

    linkText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
    },

    footer: {
      marginTop: 32,
      alignItems: 'center',
    },

    footerText: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
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
      color: colors.onSurface,
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
      borderColor: colors.outline,
      backgroundColor: colors.surfaceVariant,
      alignItems: 'center',
    },

    genderOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryContainer,
    },

    genderOptionText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.onSurfaceVariant,
    },

    genderOptionTextSelected: {
      color: colors.onPrimaryContainer,
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
      color: colors.onSurfaceVariant,
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
      color: colors.onSurfaceVariant,
    },

    guideContainer: {
      marginTop: 24,
      padding: 16,
      backgroundColor: colors.secondaryContainer,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.outline,
    },

    guideTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 8,
    },

    guideText: {
      fontSize: 13,
      color: colors.onSecondaryContainer,
      lineHeight: 20,
    },
  });
};
