import { cartReducer, initialCartState } from '@/context/CartContext';
import { authReducer, initialAuthState } from '@/context/AuthContext';
import { Product } from '@/types/product';
jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));

const sampleProduct: Product = {
  id: 1,
  title: 'iPhone 15 Pro',
  description: 'Flagship smartphone',
  category: 'smartphones',
  price: 1000,
  discountPercentage: 10,
  rating: 4.8,
  stock: 5,
  tags: ['phone'],
  brand: 'Apple',
  sku: 'IPH-15P',
  weight: 200,
  dimensions: { width: 7, height: 15, depth: 0.8 },
  warrantyInformation: '1 year',
  shippingInformation: 'Ships in 2 days',
  availabilityStatus: 'In Stock',
  reviews: [],
  returnPolicy: '30 days',
  minimumOrderQuantity: 1,
  meta: {
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    barcode: '123456',
    qrCode: 'qr',
  },
  images: ['https://example.com/1.png'],
  thumbnail: 'https://example.com/thumb.png',
};

describe('CartContext Reducer', () => {
  it('adds a new product to the cart and respects stock cap', () => {
    const state1 = cartReducer(initialCartState, {
      type: 'ADD_ITEM',
      payload: { product: sampleProduct, quantity: 2 },
    });
    expect(state1.items).toHaveLength(1);
    expect(state1.items[0].quantity).toBe(2);

    const state2 = cartReducer(state1, {
      type: 'ADD_ITEM',
      payload: { product: sampleProduct, quantity: 10 },
    });
    expect(state2.items[0].quantity).toBe(5);
  });

  it('updates item quantity and removes when quantity reaches 0', () => {
    const added = cartReducer(initialCartState, {
      type: 'ADD_ITEM',
      payload: { product: sampleProduct, quantity: 3 },
    });
    const updated = cartReducer(added, {
      type: 'UPDATE_QUANTITY',
      payload: { productId: 1, quantity: 1 },
    });
    expect(updated.items[0].quantity).toBe(1);

    const removed = cartReducer(updated, {
      type: 'UPDATE_QUANTITY',
      payload: { productId: 1, quantity: 0 },
    });
    expect(removed.items).toHaveLength(0);
  });

  it('applies coupon and toggles wishlist items', () => {
    const withCoupon = cartReducer(initialCartState, {
      type: 'APPLY_COUPON',
      payload: 'SAVE10',
    });
    expect(withCoupon.couponCode).toBe('SAVE10');

    const wished = cartReducer(withCoupon, {
      type: 'TOGGLE_WISHLIST',
      payload: sampleProduct,
    });
    expect(wished.wishlist).toHaveLength(1);

    const unwished = cartReducer(wished, {
      type: 'TOGGLE_WISHLIST',
      payload: sampleProduct,
    });
    expect(unwished.wishlist).toHaveLength(0);
  });
});

describe('AuthContext Reducer', () => {
  it('handles AUTH_SUCCESS, AUTH_UPDATE_USER, and AUTH_LOGOUT', () => {
    const mockUser = {
      id: 1,
      username: 'emilys',
      email: 'emily@example.com',
      firstName: 'Emily',
      lastName: 'Johnson',
      gender: 'female' as const,
      image: 'https://example.com/avatar.png',
      token: 'tok-123',
      refreshToken: 'ref-123',
    };

    const loggedIn = authReducer(initialAuthState, {
      type: 'AUTH_SUCCESS',
      payload: mockUser,
    });
    expect(loggedIn.isAuthenticated).toBe(true);
    expect(loggedIn.user?.firstName).toBe('Emily');

    const updated = authReducer(loggedIn, {
      type: 'AUTH_UPDATE_USER',
      payload: { firstName: 'Emilia' },
    });
    expect(updated.user?.firstName).toBe('Emilia');

    const loggedOut = authReducer(updated, { type: 'AUTH_LOGOUT' });
    expect(loggedOut.isAuthenticated).toBe(false);
    expect(loggedOut.user).toBeNull();
  });
});