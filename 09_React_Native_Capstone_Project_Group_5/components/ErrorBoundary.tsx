/**
 * ErrorBoundary - catches render errors and shows a friendly recovery screen.
 * Uses only core React Native components so it works even if providers fail.
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { createStyles } from '@/context/ThemeContext';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    message: string;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, message: '' };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, message: error.message };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error('Unhandled UI error:', error, info.componentStack);
    }

    private reset = () => this.setState({ hasError: false, message: '' });

    render() {
        if (!this.state.hasError) return this.props.children;
        return (
            <View style={styles.container}>
                <Text style={styles.emoji}>🍳</Text>
                <Text style={styles.title}>Oops, something burned</Text>
                <Text style={styles.message}>
                    The app ran into an unexpected problem. Please try again.
                </Text>
                <TouchableOpacity style={styles.button} onPress={this.reset} accessibilityRole="button">
                    <Text style={styles.buttonText}>Try again</Text>
                </TouchableOpacity>
            </View>
        );
    }
}

const styles = createStyles({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#FFFDF8' },
    emoji: { fontSize: 56 },
    title: { fontSize: 22, fontWeight: '700', color: '#3E2723', marginTop: 16 },
    message: { fontSize: 15, color: '#8D6E63', textAlign: 'center', marginTop: 8 },
    button: { marginTop: 24, backgroundColor: '#E85D04', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
    buttonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
});