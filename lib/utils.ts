import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { BackendProductionRecord } from '../types/api.types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Data validation and transformation utilities for A-AS column mapping

/**
 * Validate that data has required fields matching backend GoogleSheetsProductionDto
 */
export function validateProductionRecord(data: any): data is BackendProductionRecord {
  return (
    typeof data === 'object' &&
    data !== null &&
    // Must have primary key
    (typeof data.maChuyen === 'string' || typeof data.maChuyenLine === 'string') &&
    // Must have factory
    typeof data.nhaMay === 'string' &&
    // Must have production quantity
    typeof data.slth === 'number'
  );
}

/**
 * Transform field names from legacy to standardized backend format
 */
export function normalizeFieldNames(data: any): Partial<BackendProductionRecord> {
  const normalized: any = { ...data };
  
  // Mapping legacy names to standardized names (chuẩn hóa theo cột A-AS)
  const fieldMappings = {
    // Legacy -> New field mapping
    'hitPPH': 'phanTramHtPph',      // K: %HT PPH
    'hitSLTH': 'phanTramHt',        // W: %HT
    'boTargetGio': 'bqTargetGio',   // AO: BQ TARGET GIỜ
    'mucDo100': 'phanTram100',      // AJ: 100%
    'factory': 'nhaMay',             // B: NHÀ MÁY
    'team': 'to',                    // D: TỔ
    'actual_quantity': 'slth',       // F: SLTH (compatibility)
    'targetDay': 'targetNgay',       // T: TARGET NGÀY (compatibility)
  };
  
  // Apply field mappings
  Object.entries(fieldMappings).forEach(([oldKey, newKey]) => {
    if (data[oldKey] !== undefined && normalized[newKey] === undefined) {
      normalized[newKey] = data[oldKey];
    }
  });
  
  // Normalize hourly data keys (X-AH)
  const hourlyMappings = {
    'h8h30': 'h830',   // X: 8H30
    'h9h30': 'h930',   // Y: 9H30
    'h10h30': 'h1030', // Z: 10H30
    'h11h30': 'h1130', // AA: 11H30
    'h13h30': 'h1330', // AB: 13H30
    'h14h30': 'h1430', // AC: 14H30
    'h15h30': 'h1530', // AD: 15H30
    'h16h30': 'h1630', // AE: 16H30
    'h18h00': 'h1800', // AF: 18H00
    'h19h00': 'h1900', // AG: 19H00
    'h20h00': 'h2000', // AH: 20H00
    'percentageh8h30': 'percentageh830',   // New: percentageh830
    'percentageh9h30': 'percentageh930',   // New: percentageh930
    'percentageh10h30': 'percentageh1030', // New: percentageh1030
    'percentageh11h30': 'percentageh1130', // New: percentageh1130
    'percentageh13h30': 'percentageh1330', // New: percentageh1330
    'percentageh14h30': 'percentageh1430', // New: percentageh1430
    'percentageh15h30': 'percentageh1530', // New: percentageh1530
    'percentageh16h30': 'percentageh1630', // New: percentageh1630
    'percentageh18h00': 'percentageh1800', // New: percentageh1800
    'percentageh19h00': 'percentageh1900', // New: percentageh1900
    'percentageh20h00': 'percentageh2000', // New: percentageh2000
  };
  
  // Apply hourly field mappings
  Object.entries(hourlyMappings).forEach(([oldKey, newKey]) => {
    if (data[oldKey] !== undefined) {
      normalized[newKey] = data[oldKey];
    }
  });
  
  // Normalize hourlyData object if it exists
  if (data.hourlyData && typeof data.hourlyData === 'object') {
    const normalizedHourlyData: any = {};
    Object.entries(hourlyMappings).forEach(([oldKey, newKey]) => {
      if (data.hourlyData[oldKey] !== undefined) {
        normalizedHourlyData[newKey] = data.hourlyData[oldKey];
      } else if (data.hourlyData[newKey] !== undefined) {
        normalizedHourlyData[newKey] = data.hourlyData[newKey];
      }
    });
    normalized.hourlyData = normalizedHourlyData;
  }
  
  return normalized;
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

export function getPercentageTrueOrFalse(percentage: number): {
  textColor: string;
} {
 if (percentage >= 100) { 
    return {
      textColor: 'lkth-text-good', // Bright neon green
    };
  } else  {
    return {
      textColor: 'lkth-text-critical', // Bright red
    };
  } 
}

export function getPercentageColorForError(percentage: number): {
  bgColor: string;
  textColor: string;
  borderColor: string;
  textColorNew: string;
  shadow: string;
} {
  if (percentage <= 2) {
    return {
      bgColor: 'bg-green-500',
      textColor: 'text-white',
      borderColor: 'border-green-400',
      textColorNew: 'text-green-500',
      shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.5)]' // viền sáng xanh lá tươi
    };
  } else if (percentage > 2 && percentage <= 3.75) {
    return {
      bgColor: 'bg-yellow-400',
      textColor: 'text-black',
      borderColor: 'border-yellow-300',
      textColorNew: 'text-yellow-300',
      shadow: 'shadow-[0_0_15px_rgba(250,204,21,0.5)]' // ánh sáng vàng
    };
  } else {
    return {
      bgColor: 'bg-red-500',
      textColor: 'text-white',
      borderColor: 'border-red-500',
      textColorNew: 'text-red-500',
      shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.55)]' // đỏ cảnh báo mạnh
    };
  }
}

export function getPercentageColorForQCError(percentage: number, isCritical: boolean): {
  bgColor: string;
  textColor: string;
  borderColor: string;
  textColorNew: string;
  shadow: string;
} {
  if (isCritical){
    if (percentage <= 1.5) {
      return {
        bgColor: 'bg-green-500',
        textColor: 'text-white',
        borderColor: 'border-green-400',
        textColorNew: 'text-green-500',
        shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.5)]' // viền sáng xanh lá tươi
      };
    } else {
      return {
        bgColor: 'bg-red-500',
        textColor: 'text-white',
        borderColor: 'border-red-500',
        textColorNew: 'text-red-500',
        shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.55)]' // đỏ cảnh báo mạnh
      };
    }
  } else {
    if (percentage <= 2.5) {
      return {
        bgColor: 'bg-green-500',
        textColor: 'text-white',
        borderColor: 'border-green-400',
        textColorNew: 'text-green-500',
        shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.5)]' // viền sáng xanh lá tươi
      };
    } else {
      return {
        bgColor: 'bg-red-500',
        textColor: 'text-white',
        borderColor: 'border-red-500',
        textColorNew: 'text-red-500',
        shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.55)]' // đỏ cảnh báo mạnh
      };
    }
  }
}


export function getPercentageColorForRFT(percentage: number): {
  bgColor: string;
  textColor: string;
  borderColor: string;
  textColorNew: string;
  shadow: string;
} {
  if (percentage >= 92) {
    return {
      bgColor: 'bg-green-500',
      textColor: 'text-white',
      borderColor: 'border-green-600',
      textColorNew: 'text-green-500',
      shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.5)]' // viền sáng xanh lá tươi
    };
  } else if (percentage >= 85) {
    return {
      bgColor: 'bg-yellow-300',
      textColor: 'text-black',
      borderColor: 'border-yellow-300',
      textColorNew: 'text-yellow-300',
      shadow: 'shadow-[0_0_15px_rgba(250,204,21,0.5)]' // ánh sáng vàng
    };
  }  else {
    return {
      bgColor: 'bg-red-500',
      textColor: 'text-white',
      borderColor: 'border-red-600',
      textColorNew: 'text-red-500',
      shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.55)]' // đỏ cảnh báo mạnh
    };
  } 
}

/**
 * Get CSS color class string based on percentage (simplified version)
 */
export function getPercentageColorClass(percentage: number): string {
  if (percentage >= 100) return 'bg-fuchsia-500 text-white';
  if (percentage >= 95) return 'bg-green-500 text-white';
  if (percentage >= 90) return 'bg-yellow-400 text-black';
  if (percentage >= 85) return 'bg-orange-500 text-white';
  return 'bg-red-500 text-white';
}

/**
 * Get background color for percentage classification according to Vietnamese quality standards
 * Based on image: >=100% (purple), 95%-<100% (green), 90%-<95% (yellow), 85%-<90% (orange), <85% (red)
 */
export function getPercentageBackgroundColor(percentage: number): string {
  if (percentage >= 100) {
    return '#8B5CF6'; // Purple - Tím
  } else if (percentage >= 95) {
    return '#10B981'; // Green - Xanh lá
  } else if (percentage >= 90) {
    return '#F59E0B'; // Yellow - Vàng
  } else if (percentage >= 85) {
    return '#F97316'; // Orange - Cam
  } else {
    return '#EF4444'; // Red - Đỏ
  }
}
