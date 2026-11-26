import React from 'react';
import { Text, Pressable } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RewardsProvider, useRewards } from '@/context/RewardsContext';

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1 } }),
}));

function Probe() {
  const { state, addPoints, redeemCoupon } = useRewards();
  return (
    <>
      <Text>pts:{state.points}</Text>
      <Text>coupons:{state.coupons.length}</Text>
      <Pressable onPress={() => addPoints(5)}><Text>add</Text></Pressable>
      <Pressable onPress={() => redeemCoupon('nope')}><Text>redeem</Text></Pressable>
    </>
  );
}

describe('RewardsProvider', () => {
  it('renders and updates points', async () => {
    const { getByText } = render(<RewardsProvider><Probe /></RewardsProvider>);
    await waitFor(() => expect(getByText('pts:0')).toBeTruthy(), { timeout: 10000 });
    fireEvent.press(getByText('add'));
    await waitFor(() => expect(getByText('pts:5')).toBeTruthy(), { timeout: 10000 });
  }, 15000);
});
