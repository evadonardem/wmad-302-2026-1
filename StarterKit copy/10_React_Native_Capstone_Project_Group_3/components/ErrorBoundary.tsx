/**
 * Error Boundary - catches render errors anywhere below it and shows a friendly
 * recovery screen instead of a blank app.
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.container}>
        <MaterialCommunityIcons name="alert-circle-outline" size={72} color="#EA4335" />
        <Text style={styles.title}>Oops, something broke</Text>
        <Text style={styles.message}>
          An unexpected error occurred. You can try again — your cart and account are safe.
        </Text>
        {__DEV__ && <Text style={styles.details}>{this.state.error.message}</Text>}
        <Button mode="contained" onPress={this.handleReset} style={styles.button}>
          Try Again
        </Button>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#F8F9FA',
  },
  title: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: '700',
    color: '#202124',
  },
  message: {
    marginTop: 8,
    fontSize: 15,
    textAlign: 'center',
    color: '#5F6368',
  },
  details: {
    marginTop: 12,
    fontSize: 12,
    color: '#EA4335',
    textAlign: 'center',
  },
  button: {
    marginTop: 24,
    borderRadius: 8,
  },
});
