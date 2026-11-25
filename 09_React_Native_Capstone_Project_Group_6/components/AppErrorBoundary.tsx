import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, useTheme } from 'react-native-paper';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled application rendering error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.onBackground }]}>Something went wrong</Text>
      <Text style={[styles.message, { color: colors.onSurfaceVariant }]}>
        The screen encountered an unexpected error. Try again, or restart the app.
      </Text>
      <Button mode="contained" onPress={onRetry}>Try again</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  message: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 8 },
});
