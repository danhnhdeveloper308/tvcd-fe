import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { BackendProductionRecord } from '../types/api.types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safe number parsing matching backend parsing logic
 */
export function safeParseNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Safe percentage parsing matching backend logic
 */
export function safeParsePercentage(value: any): number {
  const num = safeParseNumber(value);
  if (typeof value === 'string' && value.includes('%')) {
    return num;
  }
  return num > 1 ? num : num * 100;
}

/**
 * Get color based on percentage value following quality standards
 * Based on the color scale: >=100% (purple), >=95% (green), >=90% (yellow), >=85% (orange), <85% (red)
 */
export function getPercentageColor(percentage: number): {
  bgColor: string;
  textColor: string;
  borderColor: string;
  textColorNew: string;
  shadow: string;
} {
  if (percentage >= 100.5) {
    return {
      bgColor: 'bg-fuchsia-500',
      textColor: 'text-white',
      borderColor: 'border-fuchsia-600',
      textColorNew: 'text-fuchsia-500',
      shadow: 'shadow-[0_0_15px_rgba(192,38,211,0.5)]' 
    };
  } else if (percentage >= 95) { 
    return {
      bgColor: 'bg-green-500',
      textColor: 'text-white',
      borderColor: 'border-green-600',
      textColorNew: 'text-green-500',
      shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.5)]' 
    };
  } else if (percentage >= 90) {
    return {
      bgColor: 'bg-yellow-300',
      textColor: 'text-black',
      borderColor: 'border-yellow-300',
      textColorNew: 'text-yellow-300',
      shadow: 'shadow-[0_0_15px_rgba(250,204,21,0.5)]'
    };
  } else if (percentage >= 85) {
    return {
      bgColor: 'bg-orange-500',
      textColor: 'text-white',
      borderColor: 'border-orange-500',
      textColorNew: 'text-orange-500',
      shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.5)]' 
    };
  } else if (percentage >= 0 && percentage < 85) {
    return {
      bgColor: 'bg-red-500',
      textColor: 'text-white',
      borderColor: 'border-red-600',
      textColorNew: 'text-red-500',
      shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.55)]' 
    };
  } 
   else{
     return {
      // bgColor: 'bg-gray-200',
      bgColor: 'bg-white',
      textColor: 'text-black',
      borderColor: '',
      textColorNew: '',
      shadow: 'shadow-none' 
    };
  }
}

export function getPercentageTextColor(percentage: number): {
  textColor: string;
} {
  if (percentage >= 100.5) {
    return {
      textColor: 'lkth-text-excellent', // Bright magenta/fuchsia
    };
  } else if (percentage >= 95) { 
    return {
      textColor: 'lkth-text-good', // Bright neon green
    };
  } else if (percentage >= 90) {
    return {
      textColor: 'lkth-text-warning', // Bright yellow
    };
  } else if (percentage >= 85) {
    return {
      textColor: 'lkth-text-alert', // Bright orange
    };
  } else if (percentage >= 0 && percentage < 85) {
    return {
      textColor: 'lkth-text-critical', // Bright red
    };
  } 
   else{
     return {
      textColor: 'lkth-text-default', // Pure white
    };
  }
}
