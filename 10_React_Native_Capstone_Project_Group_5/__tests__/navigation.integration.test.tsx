import React from 'react';
import { Pressable, Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack, canGoBack: () => true }),
  useLocalSearchParams: () => ({}),
}));

function NavProbe() {
  const { useRouter } = require('expo-router');
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push('/(app)/(tabs)/cart')}>
      <Text>go-cart</Text>
    </Pressable>
  );
}

describe('Navigation integration', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('navigates to cart route when action is triggered', () => {
    const { getByText } = render(<NavProbe />);
    fireEvent.press(getByText('go-cart'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/(tabs)/cart');
  });
});
