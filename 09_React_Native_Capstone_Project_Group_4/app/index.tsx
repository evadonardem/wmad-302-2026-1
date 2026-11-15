import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFDF8' }}>
        <ActivityIndicator size="large" color="#E85D04" />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? '/(app)/(tabs)/home' : '/(auth)/login'} />;
}