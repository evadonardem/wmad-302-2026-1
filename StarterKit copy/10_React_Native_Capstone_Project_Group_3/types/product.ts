/**
 * Product Types - DummyJSON Products API
 * Docs: https://dummyjson.com/docs/products
 */

export interface ProductReview {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
  reviewerEmail: string;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand?: string;
  sku: string;
  weight: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  reviews: ProductReview[];
  returnPolicy: string;
  minimumOrderQuantity: number;
  meta: {
    createdAt: string;
    updatedAt: string;
    barcode: string;
    qrCode: string;
  };
  images: string[];
  thumbnail: string;
}

/** The subset of product fields needed to render a card (search results, wishlist, grids). */
export type ProductSummary = Pick<
  Product,
  'id' | 'title' | 'thumbnail' | 'category' | 'price' | 'discountPercentage' | 'rating' | 'stock'
> & { brand?: string };

export interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

/** `GET /products/categories` returns objects (the plain string list lives at `/products/category-list`). */
export interface ProductCategory {
  slug: string;
  name: string;
  url: string;
}

export type ProductSortField = 'title' | 'price' | 'rating' | 'discountPercentage';

export interface ProductSearchParams {
  q?: string;
  limit?: number;
  skip?: number;
  select?: string;
  sortBy?: ProductSortField;
  order?: 'asc' | 'desc';
}

export interface CartLine {
  id: number;
  title: string;
  price: number;
  quantity: number;
  total: number;
  discountPercentage: number;
  discountedTotal?: number;
  /** `POST /carts/add` returns `discountedPrice` instead of `discountedTotal`. */
  discountedPrice?: number;
  thumbnail: string;
}

export interface Cart {
  id: number;
  products: CartLine[];
  total: number;
  discountedTotal: number;
  totalProducts: number;
  totalQuantity: number;
  userId: number;
}

export interface CartAddRequest {
  userId: number;
  products: {
    id: number;
    quantity: number;
  }[];
}

/** An item in the local shopping cart (persisted to AsyncStorage). */
export interface CartItem {
  productId: number;
  title: string;
  thumbnail: string;
  price: number;
  discountPercentage: number;
  quantity: number;
  stock: number;
}
