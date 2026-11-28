/**
 * Product & Cart API Service - DummyJSON
 * Docs: https://dummyjson.com/docs/products, https://dummyjson.com/docs/carts
 */

import axios, { AxiosInstance } from 'axios';
import { Product, ProductsResponse, ProductSearchParams, Cart, CartAddRequest, CartItem, UserCartsResponse } from '@/types/product';

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
  async getCategories(): Promise<string[]> {
    const response = await this.client.get<Array<string | { slug: string }>>('/products/categories');
    return response.data.map((category) =>
      typeof category === 'string' ? category : category.slug
    );
  }

  /**
   * Get products by brand. DummyJSON does not expose a brand-specific products route.
   */
  async getProductsByBrand(brand: string, params: ProductSearchParams = {}): Promise<ProductsResponse> {
    const response = await this.client.get<ProductsResponse>('/products', {
      params: { limit: 0 },
    });
    const products = response.data.products.filter(
      (product) => product.brand?.toLowerCase() === brand.toLowerCase()
    );
    const limit = params.limit ?? 30;
    const skip = params.skip ?? 0;

    return {
      products: products.slice(skip, skip + limit),
      total: products.length,
      skip,
      limit,
    };
  }

  // ============ Carts ============

  /**
   * Get user's cart
   */
  async getUserCart(userId: number): Promise<UserCartsResponse> {
    const response = await this.client.get<UserCartsResponse>(`/carts/user/${userId}`);
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