import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';

export type SettingsAction = {
  icon: ReactNode;
  name: string;
  onPress?: () => void;
};

export default function GeneralSettings({ actions }: { actions: SettingsAction[] }) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {actions.map((action, index) => (
        <Pressable
          key={action.name}
          style={({ pressed }) => [
            styles.actionRow,
            { backgroundColor: pressed ? `${theme.colors.primary}10` : 'transparent' },
            index !== actions.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.border }
          ]}
          onPress={action.onPress ?? (() => {})}
        >
          <View style={[styles.iconWrapper, { backgroundColor: `${theme.colors.primary}10` }]}>
            {action.icon}
          </View>
          <Text style={[styles.actionName, { color: theme.colors.text }]}>{action.name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden', // Ensures row borders don't poke out
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 64,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionName: {
    fontSize: 16,
    fontWeight: '500',
  },
});