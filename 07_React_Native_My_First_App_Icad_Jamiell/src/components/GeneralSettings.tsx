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
      {actions.map((action) => (
        <Pressable
          key={action.name}
          style={({ pressed }) => [
            styles.actionRow,
            { backgroundColor: pressed ? `${theme.colors.primary}12` : 'transparent' },
          ]}
          onPress={action.onPress ?? (() => {})}
        >
          {action.icon}
          <Text style={[styles.actionName, { color: theme.colors.text }]}>{action.name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 10,
    minHeight: 58,
  },
  actionName: {
    fontSize: 15,
  },
});
