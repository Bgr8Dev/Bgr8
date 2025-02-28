import { IconType } from 'react-icons';
import { Timestamp } from 'firebase/firestore';

// Base interface with common properties
interface BaseMarketingItem {
  id: string;
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Category interface
export interface MarketingCategory extends BaseMarketingItem {
  name: string;
  description?: string;
  orderIndex: number;
}

// Software interface
export interface MarketingSoftware extends BaseMarketingItem {
  name: string;
  description: string;
  category: string;
  iconName: string;
}

// Service interface
export interface MarketingService extends BaseMarketingItem {
  category: string;
  title: string;
  description?: string;
  price: string;
  iconName: string;
  services: string[];
}

// Company interface
export interface MarketingCompany extends BaseMarketingItem {
  name: string;
  websiteUrl: string;
  imageUrl: string;
  imagePath: string; // Path in Firebase Storage
  description?: string;
}

// Pricing Plan interface
export interface MarketingPricingPlan extends BaseMarketingItem {
  title: string;
  price: string;
  description: string;
  iconName: string;
  orderIndex: number;
  features?: string[];
}

// Default data types for initialization
export interface DefaultMarketingData {
  categories: Omit<MarketingCategory, 'id' | 'createdAt' | 'updatedAt'>[];
  software: Omit<MarketingSoftware, 'id' | 'createdAt' | 'updatedAt'>[];
  services: Omit<MarketingService, 'id' | 'createdAt' | 'updatedAt'>[];
  companies: Omit<MarketingCompany, 'id' | 'createdAt' | 'updatedAt'>[];
  pricingPlans: Omit<MarketingPricingPlan, 'id' | 'createdAt' | 'updatedAt'>[];
}

// Type for a string mapped to an icon component
export interface IconMapping {
  [key: string]: IconType;
} 