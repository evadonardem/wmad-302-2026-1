import { View } from 'react-native';
import QuoteOfTheDay from '@/components/QuoteOfTheDay';
import { useTheme } from '@/theme';

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <QuoteOfTheDay />
    </View>
  );
}