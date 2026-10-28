import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';

export type SettingsAction = {
  icon: ReactNode;
  name: string;
  onPress?: () => void;
};

export default function GeneralSettings({ actions }: { actions: SettingsAction[] }) {
  const theme = useTheme();

  // TODO 12 [Settings Actions List]: Map through the 'actions' prop array and render an
  
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      {/* TODO 12: Map the 'actions' prop into rows here */}
      {actions.map((action, index) => (
        <Pressable
          key={index}
          style={styles.actionRow}
          onPress={action.onPress ?? (() => {})}
        >
          {action.icon}
          <Text style={styles.actionName}>{action.name}</Text>
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
  },
  actionName: {
    fontSize: 15,
  },
});