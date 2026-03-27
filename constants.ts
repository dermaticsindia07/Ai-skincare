import React from 'react';
import { SkincareGoal } from "./types";
import { AcneIcon, OilDropIcon, TextureIcon, SparklesIcon, ZapIcon, HydrationIcon, AgingIcon, WindIcon, RednessIcon, ShieldCheckIcon, EyeIcon, PigmentationIcon, FolderIcon, HeartIcon, SunIcon, MinusIcon } from "./components/Icons";

export const SKINCARE_GOALS: SkincareGoal[] = [
  { id: "acne_control", label: "Clear Acne & Breakouts", relatedConditions: ["Acne & Breakouts"], icon: AcneIcon },
  { id: "oil_control", label: "Control Oil & Shine", relatedConditions: ["Oil Control & Sebum"], icon: OilDropIcon },
  { id: "texture", label: "Refine Skin Texture", relatedConditions: ["Skin Texture & Surface"], icon: TextureIcon },
  { id: "pores", label: "Minimize Pore Appearance", relatedConditions: ["Skin Texture & Surface", "Oil Control & Sebum"], icon: EyeIcon },
  { id: "brightening", label: "Even Skintone & Brighten", relatedConditions: ["Pigmentation"], icon: SparklesIcon },
  { id: "dark_spots", label: "Fade Dark Spots", relatedConditions: ["Pigmentation"], icon: ZapIcon },
  { id: "hydration", label: "Boost Hydration", relatedConditions: ["Hydration Levels"], icon: HydrationIcon },
  { id: "anti_aging", label: "Reduce Fine Lines & Wrinkles", relatedConditions: ["Signs of Aging"], icon: AgingIcon },
  { id: "firmness", label: "Improve Firmness & Elasticity", relatedConditions: ["Signs of Aging"], icon: WindIcon },
  { id: "redness_reduction", label: "Soothe Redness & Irritation", relatedConditions: ["Redness & Sensitivity"], icon: RednessIcon },
  { id: "barrier_support", label: "Strengthen Skin Barrier", relatedConditions: ["Redness & Sensitivity", "Hydration Levels"], icon: ShieldCheckIcon },
  { id: "maintain_healthy", label: "Maintain Healthy Skin", relatedConditions: ["Healthy Skin"], icon: HeartIcon },
  { id: "none", label: "None of these", relatedConditions: [], icon: MinusIcon },
  { id: "other", label: "Other", relatedConditions: [], icon: FolderIcon },
];

export const COMMON_DURATIONS: string[] = [
  "1 Week",
  "2 Weeks",
  "1 Month",
  "3 Months",
  "6 Months",
  "1 Year",
  "2 Years",
  "More than 2 years",
];

export const COMMON_PRODUCTS: string[] = [
  "Broad-Spectrum Sunscreen SPF 50",
  "Gentle Hydrating Cleanser",
  "Glycolic Acid Toner",
  "Hyaluronic Acid Serum",
  "Lightweight Moisturizer",
  "Niacinamide Serum",
  "Retinol Cream",
  "Rich Moisturizer",
  "Salicylic Acid Cleanser",
  "Vitamin C Serum",
];

export const CATEGORY_STYLES: Record<string, {
    name: string;
    icon: React.FC<any>;
    hex: string;
    tailwind: {
        bg: string;
        border: string;
        text: string;
        icon: string;
        progress: string;
        legendBorder: string;
        legendBg: string;
    };
}> = {
    'Healthy Skin': {
        name: 'Healthy Skin', icon: ShieldCheckIcon, hex: '#22c55e', tailwind: {
            bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: 'text-green-500',
            progress: 'bg-green-500', legendBorder: 'border-green-500', legendBg: 'bg-green-100',
        }
    },
    'Acne & Breakouts': {
        name: 'Acne & Breakouts', icon: AcneIcon, hex: '#ef4444', tailwind: {
            bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-500',
            progress: 'bg-red-500', legendBorder: 'border-red-500', legendBg: 'bg-red-100',
        }
    },
    'Oil Control & Sebum': {
        name: 'Oil Control & Sebum', icon: OilDropIcon, hex: '#eab308', tailwind: {
            bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: 'text-yellow-500',
            progress: 'bg-yellow-500', legendBorder: 'border-yellow-500', legendBg: 'bg-yellow-100',
        }
    },
    'Skin Texture & Surface': {
        name: 'Skin Texture & Surface', icon: TextureIcon, hex: '#06b6d4', tailwind: {
            bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-800', icon: 'text-cyan-500',
            progress: 'bg-cyan-500', legendBorder: 'border-cyan-500', legendBg: 'bg-cyan-100',
        }
    },
    'Pigmentation': {
        name: 'Pigmentation', icon: PigmentationIcon, hex: '#a855f7', tailwind: {
            bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', icon: 'text-purple-500',
            progress: 'bg-purple-500', legendBorder: 'border-purple-500', legendBg: 'bg-purple-100',
        }
    },
    'Signs of Aging': {
        name: 'Signs of Aging', icon: AgingIcon, hex: '#6366f1', tailwind: {
            bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', icon: 'text-indigo-500',
            progress: 'bg-indigo-500', legendBorder: 'border-indigo-500', legendBg: 'bg-indigo-100',
        }
    },
    'Hydration Levels': {
        name: 'Hydration Levels', icon: HydrationIcon, hex: '#3b82f6', tailwind: {
            bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'text-blue-500',
            progress: 'bg-blue-500', legendBorder: 'border-blue-500', legendBg: 'bg-blue-100',
        }
    },
    'Redness & Sensitivity': {
        name: 'Redness & Sensitivity', icon: RednessIcon, hex: '#f43f5e', tailwind: {
            bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', icon: 'text-rose-500',
            progress: 'bg-rose-500', legendBorder: 'border-rose-500', legendBg: 'bg-rose-100',
        }
    },
    'Default': {
        name: 'Default', icon: FolderIcon, hex: '#6b7280', tailwind: {
            bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-800', icon: 'text-slate-500',
            progress: 'bg-slate-500', legendBorder: 'border-slate-500', legendBg: 'bg-slate-200',
        }
    }
};

export const getCategoryStyle = (category: string) => {
    const key = Object.keys(CATEGORY_STYLES).find(k => k !== 'Default' && category.toLowerCase().includes(k.toLowerCase().split(' ')[0])) || 'Default';
    return CATEGORY_STYLES[key];
};

export const LOADING_TIPS: string[] = [
  "Consistency is key! Follow your new routine daily for best results.",
  "Drink plenty of water to keep your skin hydrated from the inside out.",
  "Always remove makeup before bed to prevent clogged pores.",
  "Don't forget sunscreen every morning, even on cloudy days.",
  "A healthy, antioxidant-rich diet can significantly improve skin health.",
  "Aim for 7-9 hours of quality sleep each night for optimal skin repair.",
  "Avoid touching your face to prevent transferring bacteria and oils.",
  "Change your pillowcases regularly to keep your skin clean as you sleep.",
  "Be patient. Seeing the full benefits of a new routine can take several weeks."
];

export const LOADING_TIP_STYLES = [
  {
    Icon: SparklesIcon,
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
    iconColor: 'text-amber-500',
  },
  {
    Icon: HydrationIcon,
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-800',
    iconColor: 'text-blue-500',
  },
  {
    Icon: SunIcon,
    bg: 'bg-orange-50 border-orange-200',
    text: 'text-orange-800',
    iconColor: 'text-orange-500',
  },
  {
    Icon: HeartIcon,
    bg: 'bg-rose-50 border-rose-200',
    text: 'text-rose-800',
    iconColor: 'text-rose-500',
  },
];