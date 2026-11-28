/**
 * Styles for Rewards, Advent calendar and Gift lists screens
 */
import { StyleSheet } from 'react-native';
import type { Palette } from '@/constants/palettes';

export const makeRewardsStyles = (c: Palette) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    hero: {
      borderRadius: 24,
      padding: 20,
      alignItems: 'center',
      marginBottom: 12,
    },
    heroLabel: {
      fontSize: 14,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    heroPoints: {
      marginVertical: 4,
    },
    heroStreak: {
      fontSize: 15,
      fontWeight: '700',
    },
    heroButton: {
      marginTop: 14,
      borderRadius: 24,
    },
    message: {
      textAlign: 'center',
      fontSize: 15,
      fontWeight: '700',
      color: c.primary,
      marginBottom: 12,
    },
    sectionTitle: {
      color: c.text,
      marginBottom: 8,
    },
    subTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: c.text,
      marginTop: 12,
      marginBottom: 6,
    },
    surpriseArea: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    surpriseBox: {
      fontSize: 84,
      textAlign: 'center',
    },
    surpriseText: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
      marginTop: 8,
      textAlign: 'center',
    },
    dim: {
      opacity: 0.4,
    },
    redeemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 6,
    },
    couponCode: {
      fontSize: 15,
      fontWeight: '800',
      color: c.text,
    },
    couponDesc: {
      fontSize: 13,
      color: c.textMuted,
    },
    couponChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    couponChip: {
      borderWidth: 2,
      borderStyle: 'dashed',
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    couponChipText: {
      fontWeight: '800',
      letterSpacing: 1,
    },
    useButton: {
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    badgeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    badge: {
      width: '31%',
      flexGrow: 1,
      minWidth: 92,
      alignItems: 'center',
      padding: 10,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.surfaceMuted,
    },
    badgeEmoji: {
      fontSize: 30,
    },
    badgeName: {
      fontSize: 13,
      fontWeight: '800',
      color: c.text,
      marginTop: 4,
    },
    badgeDesc: {
      fontSize: 11,
      color: c.textMuted,
      textAlign: 'center',
    },
    // Advent calendar
    adventIntro: {
      color: c.text,
      fontSize: 15,
      textAlign: 'center',
      marginBottom: 12,
    },
    doorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'center',
    },
    door: {
      width: '22%',
      aspectRatio: 0.85,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
    },
    doorNumber: {
      fontSize: 26,
    },
    doorEmoji: {
      fontSize: 26,
    },
    doorLocked: {
      fontSize: 12,
      marginTop: 2,
    },
    rewardCard: {
      alignItems: 'center',
    },
    rewardEmoji: {
      fontSize: 56,
    },
    rewardText: {
      fontSize: 17,
      fontWeight: '800',
      color: c.text,
      textAlign: 'center',
      marginTop: 6,
    },
    // Gift lists
    listHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    listEmoji: {
      fontSize: 34,
    },
    listName: {
      color: c.text,
    },
    listMeta: {
      fontSize: 13,
      color: c.textMuted,
    },
    progressTrack: {
      height: 10,
      borderRadius: 5,
      backgroundColor: c.surfaceMuted,
      overflow: 'hidden',
      marginTop: 10,
    },
    progressFill: {
      height: '100%',
      borderRadius: 5,
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 6,
    },
    listItemImage: {
      width: 48,
      height: 48,
      borderRadius: 10,
      backgroundColor: c.surfaceMuted,
    },
    listItemTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: c.text,
    },
    listItemPrice: {
      fontSize: 13,
      fontWeight: '700',
      color: c.primary,
    },
    emojiRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginVertical: 8,
    },
    emojiOption: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    emojiOptionText: {
      fontSize: 22,
    },
  });
