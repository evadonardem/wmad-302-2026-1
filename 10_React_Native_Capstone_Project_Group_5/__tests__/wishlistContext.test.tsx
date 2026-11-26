import React from 'react';
import { Text, Pressable } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { WishlistProvider, useWishlist } from '@/context/WishlistContext';

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1 } }),
}));

function Probe() {
  const { items, toggle } = useWishlist();
  return (
    <>
      <Text>count:{items.length}</Text>
      <Pressable onPress={() => toggle({ productId: 1, title: 'P', thumbnail: 't', price: 1, discountPercentage: 0, stock: 1, category: 'c' })}>
        <Text>toggle</Text>
      </Pressable>
    </>
  );
}

describe('WishlistProvider', () => {
  it('toggles wishlist items', async () => {
    const { getByText } = render(<WishlistProvider><Probe /></WishlistProvider>);
    await waitFor(() => expect(getByText('count:0')).toBeTruthy(), { timeout: 10000 });
    fireEvent.press(getByText('toggle'));
    await waitFor(() => expect(getByText('count:1')).toBeTruthy(), { timeout: 10000 });
  }, 15000);
});
