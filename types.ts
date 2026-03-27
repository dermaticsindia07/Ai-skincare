

import React from 'react';

export interface PastProduct {
  id: string;
  name: string;
  isUsing: boolean;
  duration: string;
  image?: string; // base64 encoded string
}

export interface BoundingBox {
  imageId: number;
  box: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

export interface SkinCondition {
  name: string;
  confidence: number;
  location: string;
  boundingBoxes: BoundingBox[];
}

export interface SkinConditionCategory {
  category: string;
  conditions: SkinCondition[];
}

export interface FaceImage {
  file: File;
  previewUrl: string;
}

export interface SkincareGoal {
  id: string;
  label: string;
  relatedConditions: string[];
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
}

export interface WebsiteProduct {
  id: string;
  name: string;
  url: string;
  description: string;
  keyIngredients: string[];
  suitableFor: string[];
  imageUrl: string;
  variantId: string;
  price: string;
  originalPrice: string;
}

export interface AlternativeProduct {
  productId: string;
  productName: string;
  productUrl: string;
  productImageUrl: string;
  variantId: string;
  price: string;
  originalPrice: string;
  keyIngredients: string[];
}

export interface RoutineStep {
  productId: string;
  stepType: string;
  productName: string;
  productUrl: string;
  productImageUrl: string;
  purpose: string;
  alternatives: AlternativeProduct[];
  variantId: string;
  price: string;
  originalPrice: string;
  keyIngredients: string[];
}

export interface SkincareRoutine {
  introduction: string;
  am: RoutineStep[];
  pm: RoutineStep[];
  keyIngredients: string[];
  lifestyleTips: string[];
  disclaimer: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  productUrl: string;
  productImageUrl: string;
  quantity: number;
  variantId: string;
  price: string;
  originalPrice: string;
  keyIngredients: string[];
}
