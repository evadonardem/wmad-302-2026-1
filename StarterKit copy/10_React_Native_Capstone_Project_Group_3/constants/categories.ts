/**
 * Icons for DummyJSON product categories
 */
import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const CATEGORY_ICONS: Record<string, IconName> = {
  beauty: 'lipstick',
  fragrances: 'spray',
  furniture: 'sofa',
  groceries: 'basket',
  'home-decoration': 'lamp',
  'kitchen-accessories': 'silverware-fork-knife',
  laptops: 'laptop',
  'mens-shirts': 'tshirt-crew',
  'mens-shoes': 'shoe-formal',
  'mens-watches': 'watch',
  'mobile-accessories': 'headphones',
  motorcycle: 'motorbike',
  'skin-care': 'face-woman-shimmer',
  smartphones: 'cellphone',
  'sports-accessories': 'basketball',
  sunglasses: 'sunglasses',
  tablets: 'tablet',
  tops: 'tshirt-v',
  vehicle: 'car',
  'womens-bags': 'bag-personal',
  'womens-dresses': 'hanger',
  'womens-jewellery': 'diamond-stone',
  'womens-shoes': 'shoe-heel',
  'womens-watches': 'watch-variant',
};

export function getCategoryIcon(slug: string): IconName {
  return CATEGORY_ICONS[slug] ?? 'package-variant';
}
