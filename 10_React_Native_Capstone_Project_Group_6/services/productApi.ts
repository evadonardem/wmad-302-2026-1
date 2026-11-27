/**
 * Product & Cart API Service - DummyJSON
 * Docs: https://dummyjson.com/docs/products, https://dummyjson.com/docs/carts
 */

import axios, { AxiosInstance } from 'axios';
import {
  Product,
  ProductsResponse,
  ProductSearchParams,
  Cart,
  CartAddRequest,
  CartItem,
  CategoryInfo,
  ProductSummary,
} from '@/types/product';

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
    const response = await this.client.get<ProductsResponse>('/products', { params });
    return response.data;
  }

  async getCatalog(params: { q?: string; category?: string }): Promise<ProductSummary[]> {
    const response = await this.getProducts({ limit: 0 });
    const query = params.q?.trim().toLowerCase();
    return response.products
      .filter((product) => !query || `${product.title} ${product.description}`.toLowerCase().includes(query))
      .filter((product) => !params.category || product.category === params.category)
      .map(({ id, title, description, category, thumbnail, price, discountPercentage, rating, stock, brand }) => ({
        id, title, description, category, thumbnail, price, discountPercentage, rating, stock, brand,
      }));
  }

  async getFlashDeals(): Promise<ProductSummary[]> {
    const response = await this.getProducts({ limit: 0 });
    return response.products
      .filter((product) => product.discountPercentage > 0)
      .sort((a, b) => b.discountPercentage - a.discountPercentage)
      .slice(0, 10)
      .map(({ id, title, description, category, thumbnail, price, discountPercentage, rating, stock, brand }) => ({
        id, title, description, category, thumbnail, price, discountPercentage, rating, stock, brand,
      }));
  }

  /**
   * Get single product by ID
   */
  async getProductById(id: number): Promise<Product> {
    const response = await this.client.get<Product>(`/products/${id}`);
    return response.data;
  }

  /**
   * Search products by query
   */
  async searchProducts(query: string, params: ProductSearchParams = {}): Promise<ProductsResponse> {
    const response = await this.client.get<ProductsResponse>('/products/search', {
      params: { q: query, ...params },
    });
    return response.data;
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category: string, params: ProductSearchParams = {}): Promise<ProductsResponse> {
    const response = await this.client.get<ProductsResponse>(`/products/category/${encodeURIComponent(category)}`, {
      params,
    });
    return response.data;
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<CategoryInfo[]> {
    const response = await this.client.get<unknown>('/products/categories');
    const raw = response.data;
    if (!Array.isArray(raw)) return [];

    return raw.map((item) => {
      if (typeof item === 'string') {
        return {
          name: item.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '),
          slug: item,
        };
      }
      if (typeof item === 'object' && item !== null) {
        const category = item as { name?: string; slug?: string };
        if (category.slug) {
          return {
            name: category.name ?? category.slug,
            slug: category.slug,
          };
        }
      }
      throw new Error('Invalid category response');
    });
  }

  async getCategoryCounts(): Promise<Record<string, number>> {
    const categories = await this.getCategories();
    const results = await Promise.all(
      categories.map(async (category) => {
        try {
          const response = await this.client.get<{ total: number }>(
            `/products/category/${encodeURIComponent(category.slug)}?limit=1`
          );
          return [category.slug, response.data.total] as const;
        } catch {
          return [category.slug, 0] as const;
        }
      })
    );
    return Object.fromEntries(results);
  }

  /**
   * Get products by brand
   */
  async getProductsByBrand(brand: string, params: ProductSearchParams = {}): Promise<ProductsResponse> {
    const response = await this.client.get<ProductsResponse>(`/products/brand/${encodeURIComponent(brand)}`, {
      params,
    });
    return response.data;
  }

  // ============ Carts ============

  /**
   * Get user's cart
   */
  async getUserCart(userId: number): Promise<{ carts: Cart[]; total: number; skip: number; limit: number }> {
    const response = await this.client.get<{ carts: Cart[]; total: number; skip: number; limit: number }>(`/carts/user/${userId}`);
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
  async updateCart(id: number, products: CartAddRequest['products'], merge: boolean = true): Promise<Cart> {
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

  /**
   * Get all carts (admin)
   */
  async getAllCarts(params: { limit?: number; skip?: number } = {}): Promise<{ carts: Cart[]; total: number }> {
    const response = await this.client.get<{ carts: Cart[]; total: number }>('/carts', { params });
    return response.data;
  }
}

export const productApi = new ProductApiService();
export { ProductApiService };