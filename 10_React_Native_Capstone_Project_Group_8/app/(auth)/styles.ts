
/**
 * CartlyX Authentication Styles
 *
 * Shared responsive styles for Sign In and Sign Up.
 * Supports dynamic Light and Dark themes.
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
      paddingHorizontal: 20,
      paddingVertical: 36,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },

    logoContainer: {
      width: '100%',
      alignItems: 'center',
      marginBottom: 28,
    },

    logoImage: {
      width: 82,
      height: 82,
      marginBottom: 12,
      borderRadius: 20,
    },

    logoText: {
      fontSize: 64,
      marginBottom: 8,
    },

    appName: {
      fontSize: 34,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: -1,
    },

    tagline: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.onSurfaceVariant,
      letterSpacing: 2,
      marginTop: 6,
      textAlign: 'center',
    },

    card: {
      width: '100%',
      maxWidth: 480,
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 0,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },

    cardContent: {
      padding: 24,
    },

    title: {
      fontSize: 25,
      fontWeight: '800',
      color: colors.onSurface,
      textAlign: 'center',
      marginBottom: 6,
    },

    subtitle: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: 26,
      lineHeight: 21,
    },

    input: {
      marginBottom: 15,
      backgroundColor: colors.surface,
    },

    eyeIcon: {
      padding: 8,
    },

    eyeText: {
      fontSize: 20,
    },

    errorContainer: {
      backgroundColor: colors.errorContainer,
      borderRadius: 10,
      padding: 13,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.error,
    },

    errorText: {
      color: colors.onErrorContainer,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },

    loginButton: {
      marginTop: 8,
      marginBottom: 16,
      borderRadius: 12,
      height: 54,
      justifyContent: 'center',
    },

    buttonContent: {
      height: 54,
      paddingHorizontal: 24,
    },

    buttonText: {
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.4,
      color: colors.onPrimary,
    },

    demoContainer: {
      marginTop: 4,
    },

    divider: {
      marginVertical: 16,
    },

    demoButton: {
      paddingVertical: 13,
      paddingHorizontal: 10,
      alignItems: 'center',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.outline,
      backgroundColor: colors.surfaceVariant,
    },

    demoButtonText: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: '700',
      textAlign: 'center',
    },

    registerContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 22,
    },

    registerText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },

    link: {
      paddingHorizontal: 4,
      paddingVertical: 4,
    },

    linkText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '800',
    },

    footer: {
      width: '100%',
      maxWidth: 480,
      marginTop: 24,
      alignItems: 'center',
    },

    footerText: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 19,
    },

    nameRow: {
      flexDirection: 'row',
      gap: 10,
    },

    optionalRow: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
    },

    halfInput: {
      flex: 1,
      minWidth: 0,
    },

    genderSelector: {
      justifyContent: 'center',
    },

    genderLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.onSurface,
      marginBottom: 8,
    },

    genderOptions: {
      flexDirection: 'row',
      gap: 8,
    },

    genderOption: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
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
      fontSize: 13,
      fontWeight: '600',
      color: colors.onSurfaceVariant,
    },

    genderOptionTextSelected: {
      color: colors.onPrimaryContainer,
      fontWeight: '800',
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
      fontSize: 13,
      color: colors.onSurfaceVariant,
      lineHeight: 20,
    },

    registerButton: {
      marginTop: 8,
      marginBottom: 16,
      borderRadius: 12,
      height: 54,
      justifyContent: 'center',
    },

    loginContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
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
