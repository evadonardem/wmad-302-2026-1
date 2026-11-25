import axios from 'axios';
import { Product, ProductsResponse, CategoryItem, OrderRecord } from '@/types/product';

const BASE_URL = 'https://dummyjson.com';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
});

export interface ProductQueryParams {
  limit?: number;
  skip?: number;
  sortBy?: 'price' | 'rating' | 'title' | 'discountPercentage';
  order?: 'asc' | 'desc';
}

export const productApi = {
  async getProducts(params: ProductQueryParams = {}): Promise<ProductsResponse> {
    const { limit = 20, skip = 0, sortBy, order } = params;
    const res = await api.get<ProductsResponse>('/products', {
      params: { limit, skip, ...(sortBy ? { sortBy, order: order || 'asc' } : {}) },
    });
    return res.data;
  },

  async getProductById(id: number): Promise<Product> {
    const res = await api.get<Product>(`/products/${id}`);
    return res.data;
  },

  async searchProducts(query: string, limit = 30, skip = 0): Promise<ProductsResponse> {
    const res = await api.get<ProductsResponse>('/products/search', {
      params: { q: query, limit, skip },
    });
    return res.data;
  },

  async getCategories(): Promise<CategoryItem[]> {
    const res = await api.get<(CategoryItem | string)[]>('/products/categories');
    return res.data.map((item) => {
      if (typeof item === 'string') {
        return {
          slug: item,
          name: item
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' '),
          url: `${BASE_URL}/products/category/${item}`,
        };
      }
      return item;
    });
  },

  async getProductsByCategory(
    categorySlug: string,
    limit = 30,
    skip = 0
  ): Promise<ProductsResponse> {
    const res = await api.get<ProductsResponse>(
      `/products/category/${encodeURIComponent(categorySlug)}`,
      { params: { limit, skip } }
    );
    return res.data;
  },

  async createCartOrder(
    userId: number,
    products: { id: number; quantity: number }[]
  ): Promise<Record<string, unknown>> {
    const res = await api.post('/carts/add', {
      userId,
      products,
    });
    return res.data;
  },

  async getUserOrders(userId: number): Promise<OrderRecord[]> {
    const res = await api.get<{
      carts: {
        id: number;
        userId: number;
        products: {
          id: number;
          title: string;
          price: number;
          quantity: number;
          total: number;
          discountPercentage: number;
          discountedTotal: number;
          thumbnail: string;
        }[];
        total: number;
        discountedTotal: number;
        totalProducts: number;
        totalQuantity: number;
      }[];
    }>(`/carts/user/${userId}`);

    return (res.data.carts || []).map((cart, idx) => ({
      id: cart.id,
      userId: cart.userId,
      date: new Date(Date.now() - (idx + 1) * 86400000 * 3).toISOString(),
      status: idx === 0 ? 'Shipped' : 'Delivered',
      shippingAddress: '123 Session Road, Baguio City, Benguet',
      paymentMethod: 'Cash on Delivery (COD)',
      items: cart.products,
      total: cart.total,
      discountedTotal: cart.discountedTotal,
      totalProducts: cart.totalProducts,
      totalQuantity: cart.totalQuantity,
    }));
  },

  async updateUserProfile(
    userId: number,
    updates: { firstName?: string; lastName?: string; email?: string; phone?: string }
  ): Promise<Record<string, unknown>> {
    const res = await api.put(`/users/${userId}`, updates);
    return res.data;
  },
};