import type { ProductFilters, ProductSummary, SortOption } from '@/types/product';

export const DEFAULT_FILTERS: ProductFilters = {
  brands: [],
  sort: 'featured',
};

export const SORT_LABELS: Record<SortOption, string> = {
  featured: 'Featured',
  priceAsc: 'Price: low to high',
  priceDesc: 'Price: high to low',
  rating: 'Top rated',
  discount: 'Biggest discount',
};

export function extractBrands(products: ProductSummary[]): string[] {
  return [...new Set(products.map((product) => product.brand).filter((brand): brand is string => Boolean(brand)))]
    .sort((a, b) => a.localeCompare(b));
}

export function countActiveFilters(filters: ProductFilters): number {
  return filters.brands.length +
    Number(filters.minPrice !== undefined || filters.maxPrice !== undefined) +
    Number(filters.sort !== 'featured');
}

export function applyFilters(products: ProductSummary[], filters: ProductFilters): ProductSummary[] {
  const filtered = products.filter((product) => {
    if (filters.brands.length && (!product.brand || !filters.brands.includes(product.brand))) return false;
    if (filters.minPrice !== undefined && product.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && product.price > filters.maxPrice) return false;
    return true;
  });

  switch (filters.sort) {
    case 'priceAsc':
      return filtered.sort((a, b) => a.price - b.price);
    case 'priceDesc':
      return filtered.sort((a, b) => b.price - a.price);
    case 'rating':
      return filtered.sort((a, b) => b.rating - a.rating);
    case 'discount':
      return filtered.sort((a, b) => b.discountPercentage - a.discountPercentage);
    default:
      return filtered;
  }
}
