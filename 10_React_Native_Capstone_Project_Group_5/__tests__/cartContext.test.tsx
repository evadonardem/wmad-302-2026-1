import React from 'react';
import { Text, Pressable } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CartProvider, useCart } from '@/context/CartContext';

jest.mock('@/utils/storage', () => ({
  cartStorage: {
    getCart: jest.fn().mockResolvedValue([]),
    setCart: jest.fn().mockResolvedValue(undefined),
  },
}));

function Probe() {
  const { totalQuantity, addItem, applyCoupon, couponCode } = useCart();
  return (
    <>
      <Text>qty:{totalQuantity}</Text>
      <Text>coupon:{couponCode ?? 'none'}</Text>
      <Pressable onPress={() => addItem({ productId: 1, title: 'P', thumbnail: 't', price: 10, discountPercentage: 0, quantity: 1, stock: 5 })}><Text>add</Text></Pressable>
      <Pressable onPress={() => { applyCoupon('SAVE10'); }}><Text>coupon</Text></Pressable>
    </>
  );
}

describe('CartProvider', () => {
  it('adds items and applies coupon', async () => {
    const { getByText } = render(<CartProvider><Probe /></CartProvider>);
    await waitFor(() => expect(getByText('qty:0')).toBeTruthy(), { timeout: 10000 });
    fireEvent.press(getByText('add'));
    await waitFor(() => expect(getByText('qty:1')).toBeTruthy(), { timeout: 10000 });
    fireEvent.press(getByText('coupon'));
    await waitFor(() => expect(getByText('coupon:SAVE10')).toBeTruthy(), { timeout: 10000 });
  }, 15000);
});
