/**
 * AppDialog - the shared pop-up card used across the app
 * A deep-purple hero header (icon, eyebrow, serif title), a scrollable body and a
 * tidy pill-button footer. Every profile pop-up uses it so they all feel related:
 * wishlist, logout, edit profile, addresses, orders, payment methods and settings.
 *
 * Also exports the small building blocks those dialogs share:
 * DialogRow, DialogEmptyState, DialogSectionLabel and DialogToggleRow.
 */
import React, { ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Button, IconButton, Modal, Portal, Switch, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette, radius, softShadow, spacing, themed, typeface, withAlpha } from '@/constants/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export type DialogTone = 'brand' | 'danger';

const CREAM = '#FBF7FF';

const HERO: Record<DialogTone, { background: string; eyebrow: string; icon: string; iconBg: string; iconBorder: string }> = {
  brand: {
    background: '#3A1E70',
    eyebrow: palette.gold,
    icon: palette.gold,
    iconBg: 'rgba(242,196,90,0.16)',
    iconBorder: 'rgba(242,196,90,0.42)',
  },
  danger: {
    background: '#5A1F34',
    eyebrow: '#FFC2CE',
    icon: '#FFD9E1',
    iconBg: 'rgba(255,217,225,0.16)',
    iconBorder: 'rgba(255,217,225,0.42)',
  },
};

export interface DialogAction {
  label: string;
  onPress: () => void;
  /** Defaults to text for all but the last action, which becomes contained */
  mode?: 'text' | 'outlined' | 'contained';
  tone?: DialogTone;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
}

interface AppDialogProps {
  visible: boolean;
  onDismiss?: () => void;
  /** Disable tapping the backdrop / back button (useful while saving) */
  dismissable?: boolean;
  icon?: IconName;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  tone?: DialogTone;
  actions?: DialogAction[];
  footerNote?: string;
  /** Set false when the body is short and should not scroll */
  scroll?: boolean;
  /** Custom cap for the scrolling body (defaults to a share of the screen) */
  bodyMaxHeight?: number;
  children?: ReactNode;
}

export function AppDialog({
  visible,
  onDismiss,
  dismissable = true,
  icon,
  eyebrow,
  title,
  subtitle,
  tone = 'brand',
  actions = [],
  footerNote,
  scroll = true,
  bodyMaxHeight,
  children,
}: AppDialogProps) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const hero = HERO[tone];
  const cardWidth = Math.min(Math.max(0, width - 32), 580);
  const bodyMax = bodyMaxHeight ?? Math.max(220, height * 0.5);

  const body = <View style={styles.bodyInner}>{children}</View>;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        dismissable={dismissable}
        contentContainerStyle={[styles.cardOuter, { width: cardWidth }]}
      >
        <View style={styles.card}>
          {/* Hero header */}
          <View style={[styles.hero, { backgroundColor: hero.background }]}>
            <View style={styles.heroGlowA} />
            <View style={styles.heroGlowB} />
            <View style={styles.heroTopRow}>
              <View style={[styles.iconBadge, { backgroundColor: hero.iconBg, borderColor: hero.iconBorder }]}>
                <MaterialCommunityIcons name={icon ?? 'star-four-points-outline'} size={26} color={hero.icon} />
              </View>
              {onDismiss ? (
                <IconButton
                  icon="close"
                  size={18}
                  iconColor={withAlpha(CREAM, 0.92)}
                  style={styles.closeButton}
                  onPress={onDismiss}
                  accessibilityLabel="Close dialog"
                  disabled={!dismissable}
                />
              ) : null}
            </View>
            {eyebrow ? <Text style={[styles.eyebrow, { color: hero.eyebrow }]}>{eyebrow}</Text> : null}
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>

          {/* Body */}
          {scroll ? (
            <ScrollView
              style={{ maxHeight: bodyMax }}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {body}
            </ScrollView>
          ) : (
            <View style={styles.bodyContent}>{body}</View>
          )}

          {/* Footer */}
          {actions.length > 0 || footerNote ? (
            <View style={styles.footer}>
              {footerNote ? <Text style={styles.footerNote}>{footerNote}</Text> : null}
              {actions.length > 0 ? (
                <View style={styles.actionsRow}>
                  {actions.map((action, index) => {
                    const mode = action.mode ?? (index === actions.length - 1 ? 'contained' : 'text');
                    const danger = action.tone === 'danger';
                    return (
                      <Button
                        key={`${action.label}-${index}`}
                        mode={mode}
                        icon={action.icon}
                        onPress={action.onPress}
                        loading={action.loading}
                        disabled={action.disabled}
                        style={[styles.actionButton, actions.length > 1 && styles.actionButtonGrow]}
                        contentStyle={styles.actionContent}
                        labelStyle={styles.actionLabel}
                        textColor={danger ? (mode === 'contained' ? (theme.dark ? '#2A0A14' : '#FFFFFF') : palette.danger) : undefined}
                        buttonColor={danger && mode === 'contained' ? palette.danger : undefined}
                        accessibilityRole="button"
                      >
                        {action.label}
                      </Button>
                    );
                  })}
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </Modal>
    </Portal>
  );
}

/* ------------------------------------------------------------------ */
/* Shared rows / states                                                */
/* ------------------------------------------------------------------ */

interface DialogRowProps {
  icon?: IconName;
  image?: string;
  title: string;
  subtitle?: string;
  /** Small line under the subtitle, e.g. a price */
  meta?: string;
  badge?: string;
  onPress?: () => void;
  /** Buttons shown on the right edge */
  actions?: ReactNode;
  /** Extra content shown under the text block */
  footer?: ReactNode;
  iconColor?: string;
}

export function DialogRow({ icon, image, title, subtitle, meta, badge, onPress, actions, footer, iconColor }: DialogRowProps) {
  const content = (
    <>
      <View style={styles.rowLead}>
        {image ? (
          <Image source={{ uri: image }} style={styles.rowImage} resizeMode="contain" />
        ) : (
          <MaterialCommunityIcons name={icon ?? 'circle-outline'} size={22} color={iconColor ?? palette.forest} />
        )}
      </View>
      <View style={styles.rowText}>
        <View style={styles.rowTitleLine}>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {title}
          </Text>
          {badge ? (
            <View style={styles.rowBadge}>
              <Text style={styles.rowBadgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {subtitle ? (
          <Text style={styles.rowSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {meta ? <Text style={styles.rowMeta}>{meta}</Text> : null}
      </View>
    </>
  );

  // The row's tappable area excludes the action buttons and footer: on web a
  // role="button" Pressable renders a real <button>, and a Paper Button nested
  // inside another button is invalid DOM (and would also steal its clicks).
  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        {onPress ? (
          <Pressable
            onPress={onPress}
            accessibilityRole="button"
            style={({ pressed }) => [styles.rowMain, pressed && styles.rowPressed]}
          >
            {content}
          </Pressable>
        ) : (
          <View style={styles.rowMain}>{content}</View>
        )}
        {actions ? <View style={styles.rowActions}>{actions}</View> : null}
      </View>
      {footer ? <View style={styles.rowFooter}>{footer}</View> : null}
    </View>
  );
}

interface DialogEmptyStateProps {
  icon?: IconName;
  title: string;
  message: string;
  action?: ReactNode;
}

export function DialogEmptyState({ icon = 'inbox-outline', title, message, action }: DialogEmptyStateProps) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons name={icon} size={30} color={palette.forest} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {action ? <View style={styles.emptyAction}>{action}</View> : null}
    </View>
  );
}

export function DialogSectionLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

interface DialogToggleRowProps {
  icon: IconName;
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function DialogToggleRow({ icon, title, description, value, onValueChange }: DialogToggleRowProps) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleIcon}>
        <MaterialCommunityIcons name={icon} size={19} color={palette.forest} />
      </View>
      <View style={styles.toggleText}>
        <Text style={styles.toggleTitle}>{title}</Text>
        {description ? <Text style={styles.toggleDescription}>{description}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    // Card shell
    cardOuter: {
      borderRadius: 28,
      backgroundColor: palette.surface,
      alignSelf: 'center',
      ...softShadow('#241540', 0.32, 40, 18, 18),
    },
    card: { borderRadius: 28, overflow: 'hidden', backgroundColor: palette.surface },

    // Hero
    hero: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg, overflow: 'hidden' },
    heroGlowA: { position: 'absolute', right: -46, top: -70, width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(255,255,255,0.07)' },
    heroGlowB: { position: 'absolute', left: -60, bottom: -100, width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(255,255,255,0.05)' },
    heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
    iconBadge: { width: 52, height: 52, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    closeButton: { margin: 0, backgroundColor: 'rgba(251,247,255,0.14)' },
    eyebrow: { fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', fontWeight: '700', marginBottom: 6 },
    title: { fontFamily: typeface.display, fontSize: 26, lineHeight: 32, color: CREAM },
    subtitle: { fontSize: 13, lineHeight: 19, color: 'rgba(251,247,255,0.78)', marginTop: 6 },

    // Body
    bodyContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
    bodyInner: { gap: spacing.sm },

    // Footer
    footer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: palette.line,
      backgroundColor: palette.surface,
      gap: spacing.sm,
    },
    footerNote: { fontSize: 11, lineHeight: 16, color: palette.stone, textAlign: 'center' },
    actionsRow: { flexDirection: 'row', gap: spacing.sm },
    actionButton: { borderRadius: radius.pill },
    actionButtonGrow: { flex: 1 },
    actionContent: { height: 46, paddingHorizontal: spacing.md, gap: 6 },
    actionLabel: { fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },

    // Rows
    row: {
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: palette.ivory,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: palette.line,
      gap: spacing.sm,
    },
    rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
    rowMain: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
    rowPressed: { opacity: 0.85 },
    rowLead: { width: 46, height: 46, borderRadius: 14, backgroundColor: palette.sand, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    rowImage: { width: '78%', height: '78%' },
    rowText: { flex: 1, gap: 3 },
    rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    rowTitle: { fontSize: 14, fontWeight: '700', color: palette.ink, flexShrink: 1 },
    rowSubtitle: { fontSize: 12, lineHeight: 17, color: palette.stone },
    rowMeta: { fontSize: 13, fontWeight: '700', color: palette.forest, marginTop: 2 },
    rowBadge: { paddingHorizontal: 8, height: 20, borderRadius: radius.pill, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
    rowBadgeText: { fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: '800', color: palette.forest },
    rowFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginLeft: 62 },
    rowActions: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 2 },

    // Empty state
    empty: { alignItems: 'center', paddingVertical: spacing.lg, paddingHorizontal: spacing.md, gap: 6 },
    emptyIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    emptyTitle: { fontFamily: typeface.display, fontSize: 19, color: palette.ink, textAlign: 'center' },
    emptyMessage: { fontSize: 13, lineHeight: 19, color: palette.stone, textAlign: 'center', maxWidth: 320 },
    emptyAction: { marginTop: spacing.sm },

    // Section labels
    sectionLabel: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '700', color: palette.stone, marginTop: spacing.xs },

    // Toggle rows
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: palette.ivory,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: palette.line,
    },
    toggleIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: palette.sand, alignItems: 'center', justifyContent: 'center' },
    toggleText: { flex: 1, gap: 2 },
    toggleTitle: { fontSize: 14, fontWeight: '600', color: palette.ink },
    toggleDescription: { fontSize: 11, lineHeight: 16, color: palette.stone },
  })
);
