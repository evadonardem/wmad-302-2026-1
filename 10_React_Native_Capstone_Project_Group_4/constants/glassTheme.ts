import { Platform, ViewStyle } from 'react-native';

export const GLASS_PALETTE = {
  // Obsidian Dark Canvas & Crimson Glows
  canvasBg: '#09090D',
  surfaceDark: 'rgba(16, 16, 24, 0.78)',
  surfaceCard: 'rgba(20, 20, 30, 0.76)',
  surfaceElevated: 'rgba(28, 28, 40, 0.85)',

  // Crimson Neon Accents
  crimson: '#E11D48',
  crimsonBright: '#FF1E42',
  crimsonDark: '#9F1239',
  crimsonGlow: 'rgba(225, 29, 72, 0.28)',
  crimsonBorder: 'rgba(225, 29, 72, 0.48)',
  subtleBorder: 'rgba(255, 255, 255, 0.12)',

  // Backward-compatible theme aliases mapped to Crimson Dark palette
  dark: '#FFFFFF',
  amber: '#E11D48',
  coralBadge: '#FF1E42',
  orbAmber: 'rgba(225, 29, 72, 0.28)',
  orbSky: 'rgba(190, 18, 60, 0.22)',
  orbMint: 'rgba(159, 18, 57, 0.18)',

  // Text & Status
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  starGold: '#FBBF24',
  greenSuccess: '#22C55E',
};

export const DARK_AMBIENT_BG: ViewStyle =
  Platform.OS === 'web'
    ? ({
        backgroundImage:
          'radial-gradient(circle at 22% 18%, rgba(225, 29, 72, 0.32), transparent 44%), radial-gradient(circle at 82% 28%, rgba(190, 18, 60, 0.24), transparent 46%), radial-gradient(circle at 50% 88%, rgba(225, 29, 72, 0.18), transparent 50%)',
      } as unknown as ViewStyle)
    : {};

export const glassSurface = (opacity = 0.76, radius = 16, crimsonBorder = false): ViewStyle => ({
  backgroundColor: `rgba(18, 18, 26, ${opacity})`,
  borderRadius: radius,
  borderWidth: 1,
  borderColor: crimsonBorder ? GLASS_PALETTE.crimsonBorder : 'rgba(255, 255, 255, 0.14)',
  ...(Platform.OS === 'web'
    ? ({
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        boxShadow: crimsonBorder
          ? '0 8px 28px rgba(225, 29, 72, 0.16)'
          : '0 8px 28px rgba(0, 0, 0, 0.45)',
      } as unknown as ViewStyle)
    : {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
        elevation: 5,
      }),
});

export const amberGlassSurface = (opacity = 0.9, radius = 0): ViewStyle => ({
  backgroundColor: `rgba(11, 11, 16, ${opacity})`,
  borderRadius: radius,
  borderBottomWidth: 1,
  borderBottomColor: 'rgba(225, 29, 72, 0.35)',
  ...(Platform.OS === 'web'
    ? ({
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        boxShadow: '0 6px 24px rgba(0, 0, 0, 0.55)',
      } as unknown as ViewStyle)
    : {
        elevation: 5,
      }),
});
