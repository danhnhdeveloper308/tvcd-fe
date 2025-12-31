// CD Product Types - Matching backend CDProductSheetsService

export interface CDProductDetail {
  nhuCauLuyKe: number; // H: NHU CẦU LŨY KẾ
  tenChiTiet: string; // I: TÊN CHI TIẾT (Thân, Hồng túi...)
  keHoachGiao: number; // J: KẾ HOẠCH GIAO
  luyKeGiao: number; // K: LŨY KẾ GIAO
  conLai: number; // L: CÒN LẠI
  ttdb: number; // M: TTĐB (Tồn)
  canXuLy: number; // N: CẦN XỬ LÝ
  hidden: string; // O: HIDDEN (đánh dấu để frontend ẩn/hiện)
}

export interface CDProduct {
  ma: string; // E: MÃ (CEM07, CEN91...)
  mau: string; // F: MẪU (B4Z5D, B4Z38...)
  slkh: number; // G: SLKH
  nhuCauLuyKe: number; // H: NHU CẦU LŨY KẾ
  tenChiTiet: string; // I: TÊN CHI TIẾT (for main product)
  keHoachGiao: number; // J: KẾ HOẠCH GIAO
  luyKeGiao: number; // K: LŨY KẾ GIAO
  conLai: number; // L: CÒN LẠI
  ttdb: number; // M: TTĐB (Tồn)
  canXuLy: number; // N: CẦN XỬ LÝ
  hidden: string; // O: HIDDEN (đánh dấu để frontend ẩn/hiện)
  details: CDProductDetail[]; // Chi tiết breakdown
}

export interface CDProductData {
  maChuyenLine: string; // A: MÃ CHUYỀN (KVHB07CD24)
  factory: string; // B: NHÀ MÁY (TS3)
  line: string; // C: LINE (1+4+5)
  to: string; // D: TỔ
  sheet: string; // Sheet code (CD1, CD2, CD3, CD4)
  totalProducts: number; // Total products count
  products: CDProduct[]; // Products array
  lastUpdate: string; // ISO timestamp
}

export interface CDProductAPIResponse {
  success: boolean;
  data: CDProductData;
  timestamp: string;
  _debug?: any;
}

// WebSocket update structure
export interface CDProductWebSocketUpdate {
  sheet: string;
  type: "new" | "updated" | "deleted";
  data: CDProductData;
  changes?: {
    productsAdded: string[];
    productsRemoved: string[];
    productsModified: Array<{
      ma: string;
      fields: string[];
    }>;
  };
  timestamp: string;
  _debug?: any;
}
