import axios from 'axios';

jest.mock('axios', () => {
  const mockInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return {
    create: jest.fn(() => mockInstance),
    __mockInstance: mockInstance,
  };
});

const mockAxios = axios as unknown as { __mockInstance: { get: jest.Mock; post: jest.Mock; put: jest.Mock } };

describe('API services integration', () => {
  beforeEach(() => {
    mockAxios.__mockInstance.get.mockReset();
    mockAxios.__mockInstance.post.mockReset();
    mockAxios.__mockInstance.put.mockReset();
  });

  it('productApi.getProducts calls the products endpoint', async () => {
    mockAxios.__mockInstance.get.mockResolvedValue({
      data: { products: [{ id: 1, title: 'P', price: 10, discountPercentage: 0, rating: 4, stock: 5, thumbnail: 't', images: [], description: '', brand: '', category: 'cat' }], total: 1, skip: 0, limit: 20 },
    });
    const { productApi } = require('@/services/productApi');
    const res = await productApi.getProducts({ limit: 20 });
    expect(mockAxios.__mockInstance.get).toHaveBeenCalled();
    expect(res.products[0].id).toBe(1);
  });

  it('productApi.addCart posts cart payload', async () => {
    mockAxios.__mockInstance.post.mockResolvedValue({
      data: { id: 99, products: [], total: 10, discountedTotal: 10, userId: 1, totalProducts: 1, totalQuantity: 1 },
    });
    const { productApi } = require('@/services/productApi');
    const res = await productApi.addCart({ userId: 1, products: [{ id: 1, quantity: 1 }] });
    expect(mockAxios.__mockInstance.post).toHaveBeenCalled();
    expect(res.id).toBe(99);
  });

  it('productApi supports get/search/category', async () => {
    mockAxios.__mockInstance.get.mockImplementation((url: string) => {
      if (url.includes('/products/categories')) return Promise.resolve({ data: ['smartphones', 'laptops'] });
      return Promise.resolve({ data: { products: [], total: 0, skip: 0, limit: 20 } });
    });
    const { productApi } = require('@/services/productApi');
    await productApi.searchProducts('phone');
    await productApi.getProductsByCategory('smartphones');
    const cats = await productApi.getCategories();
    expect(cats).toEqual(['smartphones', 'laptops']);
  });
});
