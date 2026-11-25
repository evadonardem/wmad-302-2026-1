export interface ProductDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface ProductReview {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
  reviewerEmail?: string;
}

export interface ProductMeta {
  createdAt: string;
  updatedAt: string;
  barcode: string;
  qrCode: string;
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
  dimensions: ProductDimensions;
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  reviews: ProductReview[];
  returnPolicy: string;
  minimumOrderQuantity: number;
  meta: ProductMeta;
  images: string[];
  thumbnail: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

export interface CategoryItem {
  slug: string;
  name: string;
  url: string;
}

export interface CartItem {
  id: number;
  productId: number;
  title: string;
  thumbnail: string;
  price: number;
  discountPercentage: number;
  quantity: number;
  stock: number;
  brand?: string;
  category?: string;
}

export interface OrderRecord {
  id: number;
  userId: number;
  date: string;
  status: 'Processing' | 'Shipped' | 'Delivered';
  shippingAddress: string;
  paymentMethod: string;
  couponCode?: string;
  items: {
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
}