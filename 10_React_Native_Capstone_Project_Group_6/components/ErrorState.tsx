import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useAppTheme } from '@/constants/theme';

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const theme = useAppTheme();
  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={{ color: theme.colors.error, textAlign: 'center' }}>
        {message}
      </Text>
      {onRetry ? (
        <Button mode="contained" onPress={onRetry} style={styles.button}>
          Try again
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  button: { marginTop: 16 },
});
