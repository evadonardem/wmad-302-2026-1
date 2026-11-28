/**
 * Product & Cart API Service - DummyJSON
 * Docs: https://dummyjson.com/docs/products, https://dummyjson.com/docs/carts
 */

import axios, { AxiosInstance } from 'axios';
import {
  Cart,
  CartAddRequest,
  Product,
  ProductCategory,
  ProductSearchParams,
  ProductsResponse,
} from '@/types/product';

import { cacheKey, withOfflineCache } from '@/utils/apiCache';

const API_BASE_URL = 'https://dummyjson.com';

class ProductApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // ============ Products ============

  /**
   * Get all products with pagination
   */
  async getProducts(params: ProductSearchParams = {}): Promise<ProductsResponse> {
    return withOfflineCache(cacheKey('/products', params), async () => {
      const response = await this.client.get<ProductsResponse>('/products', { params });
      return response.data;
    });
  }

  /**
   * Get single product by ID
   */
  async getProductById(id: number): Promise<Product> {
    return withOfflineCache(`/products/${id}`, async () => {
      const response = await this.client.get<Product>(`/products/${id}`);
      return response.data;
    });
  }

  /**
   * Search products by query
   */
  async searchProducts(query: string, params: ProductSearchParams = {}): Promise<ProductsResponse> {
    return withOfflineCache(cacheKey('/products/search', { ...params, q: query }), async () => {
      const response = await this.client.get<ProductsResponse>('/products/search', {
        params: { ...params, q: query },
      });
      return response.data;
    });
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(
    category: string,
    params: ProductSearchParams = {}
  ): Promise<ProductsResponse> {
    return withOfflineCache(cacheKey(`/products/category/${category}`, params), async () => {
      const response = await this.client.get<ProductsResponse>(
        `/products/category/${encodeURIComponent(category)}`,
        { params }
      );
      return response.data;
    });
  }

  /**
   * Get all categories as `{ slug, name, url }` objects
   */
  async getCategories(): Promise<ProductCategory[]> {
    return withOfflineCache('/products/categories', async () => {
      const response = await this.client.get<ProductCategory[]>('/products/categories');
      return response.data;
    });
  }

  /**
   * Product count per category slug, computed from a single request
   * (`limit=0` returns every product; `select=category` keeps the payload tiny).
   */
  async getCategoryCounts(): Promise<Record<string, number>> {
    const response = await this.client.get<{ products: Pick<Product, 'id' | 'category'>[] }>(
      '/products',
      { params: { limit: 0, select: 'category' } }
    );
    return response.data.products.reduce<Record<string, number>>((counts, product) => {
      counts[product.category] = (counts[product.category] ?? 0) + 1;
      return counts;
    }, {});
  }

  // Note: DummyJSON has no `/products/brand/{brand}` endpoint, so brand
  // filtering is done on the client (see the Search screen).

  // ============ Carts ============

  /**
   * Get a user's carts (used as order history)
   */
  async getUserCarts(userId: number): Promise<{ carts: Cart[]; total: number }> {
    const response = await this.client.get<{ carts: Cart[]; total: number }>(`/carts/user/${userId}`);
    return response.data;
  }

  /**
   * Get cart by ID
   */
  async getCartById(id: number): Promise<Cart> {
    const response = await this.client.get<Cart>(`/carts/${id}`);
    return response.data;
  }

  /**
   * Create new cart (checkout)
   */
  async addCart(cartData: CartAddRequest): Promise<Cart> {
    const response = await this.client.post<Cart>('/carts/add', cartData);
    return response.data;
  }

  /**
   * Update cart
   */
  async updateCart(id: number, products: CartAddRequest['products'], merge = true): Promise<Cart> {
    const response = await this.client.put<Cart>(`/carts/${id}`, { products, merge });
    return response.data;
  }

  /**
   * Delete cart
   */
  async deleteCart(id: number): Promise<{ isDeleted: boolean; deletedOn: string }> {
    const response = await this.client.delete<{ isDeleted: boolean; deletedOn: string }>(`/carts/${id}`);
    return response.data;
  }
}

export const productApi = new ProductApiService();
export { ProductApiService };
