export interface ClothingItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ClothingCategory;
  sizes: string[];
  colors: string[];
  images: string[];
  inStock: boolean;
  dateAdded: Date;
  featured?: boolean;
}

export type ClothingCategory = 'tops' | 'bottoms' | 'outerwear' | 'accessories' | 'footwear'; 