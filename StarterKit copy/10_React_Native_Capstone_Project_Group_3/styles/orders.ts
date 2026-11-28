/**
 * Order History / Detail Styles
 */
import { StyleSheet } from 'react-native';
import type { Palette } from '@/constants/palettes';

export const makeOrdersStyles = (c: Palette) =>
  StyleSheet.create({
    listContent: {
      padding: 16,
      width: '100%',
      maxWidth: 760,
      alignSelf: 'center',
    },
    emptyContent: {
      flexGrow: 1,
    },
    orderCard: {
      borderRadius: 12,
      backgroundColor: c.surface,
      marginBottom: 12,
    },
    orderNumber: {
      fontSize: 17,
      fontWeight: '700',
      color: c.text,
    },
    orderDate: {
      marginTop: 4,
      fontSize: 13,
      color: c.textMuted,
    },
    status: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 12,
    },
    statusActive: {
      backgroundColor: c.primaryContainer,
    },
    statusDone: {
      backgroundColor: c.successContainer,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '700',
    },
    statusTextActive: {
      color: c.primary,
    },
    statusTextDone: {
      color: c.success,
    },
    thumbs: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginVertical: 12,
    },
    thumb: {
      width: 48,
      height: 48,
      borderRadius: 8,
      backgroundColor: c.surfaceMuted,
    },
    moreText: {
      fontSize: 13,
      color: c.textMuted,
      fontWeight: '600',
    },
    total: {
      fontSize: 17,
      fontWeight: '700',
      color: c.primary,
    },
    line: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    lineDivider: {
      marginVertical: 4,
    },
    lineImage: {
      width: 56,
      height: 56,
      borderRadius: 8,
      backgroundColor: c.surfaceMuted,
    },
    lineInfo: {
      flex: 1,
      marginHorizontal: 12,
    },
    lineTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: c.text,
      marginBottom: 2,
    },
    lineTotal: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
    },
    detailText: {
      fontSize: 14,
      color: c.text,
      marginBottom: 2,
    },
    paymentTitle: {
      marginTop: 16,
    },
    giftNote: {
      marginTop: 8,
      padding: 10,
      borderRadius: 8,
      backgroundColor: c.secondaryContainer,
    },
    giftNoteText: {
      fontSize: 14,
      color: c.text,
      fontStyle: 'italic',
    },
    // Tracking timeline
    timelineStep: {
      flexDirection: 'row',
      minHeight: 52,
    },
    timelineRail: {
      width: 28,
      alignItems: 'center',
    },
    timelineDot: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.border,
    },
    timelineDotDone: {
      backgroundColor: c.success,
    },
    timelineLine: {
      flex: 1,
      width: 2,
      backgroundColor: c.border,
      marginVertical: 2,
    },
    timelineLineDone: {
      backgroundColor: c.success,
    },
    timelineContent: {
      flex: 1,
      marginLeft: 10,
      paddingBottom: 12,
    },
    timelineLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
    },
    timelineLabelPending: {
      color: c.textMuted,
      fontWeight: '400',
    },
    timelineTime: {
      fontSize: 12,
      color: c.textMuted,
      marginTop: 2,
    },
  });
