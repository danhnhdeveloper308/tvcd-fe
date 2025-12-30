// TypeScript interfaces matching backend GoogleSheetsProductionDto exactly
// Supports both HTM and CD line types

export type LineType = 'HTM' | 'CD';

export interface BackendProductionRecord {
  // Line type identifier
  lineType?: LineType;
  // Thông tin cơ bản (A-E)
  maChuyen: string;           // A: MÃ CHUYỀN
  maChuyenLine: string;       // A: MÃ CHUYỀN (alias)
  nhaMay: string;             // B: NHÀ MÁY
  line: string;               // C: LINE
  to: string;                 // D: TỔ
  maHang: string;             // E: MÃ HÀNG
  canBoQuanLy?: string;   // Additional field: CÁN BỘ QUẢN LÝ

  // Sản lượng và công việc (F-L)
  slth: number;               // F: SLTH
  congKh: number;             // G: Công KH
  congTh: number;             // H: Công TH
  pphKh: number;              // I: PPH KH
  pphTh: number;              // J: PPH TH
  phanTramHtPph: number;      // K: %HT PPH
  gioSx: number;              // L: GIỜ SX
  pphThNew?: number;          // TEST: PPH TH NEW (tongDat / Công TH / 8)

  // Nhân lực (M-P)
  ldCoMat: number;            // M: LĐ CÓ MẶT
  ldLayout: number;           // N: LĐ LAYOUT
  ldHienCo: number;           // O: LĐ HIỆN CÓ
  nangSuat: number;           // P: NĂNG SUẤT

  // PPH và Target (Q-W)
  pphTarget: number;          // Q: PPH TARGET
  pphGiao: number;            // R: PPH GIAO
  phanTramGiao: number;       // S: %GIAO
  targetNgay: number;         // T: TARGET NGÀY
  targetGio: number;          // U: TARGET GIỜ
  lkth: number;               // V: LKTH
  phanTramHt: number;         // W: %HT

  // Dữ liệu theo giờ (X-AH)
  // h830: number;               // X: 8H30
  // h930: number;               // Y: 9H30
  // h1030: number;              // Z: 10H30
  // h1130: number;              // AA: 11H30
  // h1330: number;              // AB: 13H30
  // h1430: number;              // AC: 14H30
  // h1530: number;              // AD: 15H30
  // h1630: number;              // AE: 16H30
  // h1800: number;              // AF: 18H00
  // h1900: number;              // AG: 19H00
  // h2000: number;              // AH: 20H00
  // percentageh830?: number;   // AI: PERCENTAGE 8H30 (optional)
  // percentageh930?: number;   // AJ: PERCENTAGE 9H30 (optional)
  // percentageh1030?: number;  // AK: PERCENTAGE 10H30 (optional)
  // percentageh1130?: number;  // AL: PERCENTAGE 11H30 (optional)
  // percentageh1330?: number;  // AM: PERCENTAGE 13H30 (optional)
  // percentageh1430?: number;  // AN: PERCENTAGE 14H30 (optional)
  // percentageh1530?: number;  // AO: PERCENTAGE 15H30 (optional)
  // percentageh1630?: number;  // AP: PERCENTAGE 16H30 (optional)
  // percentageh1800?: number;  // AQ: PERCENTAGE 18H00 (optional)
  // percentageh1900?: number;  // AR: PERCENTAGE 19H00 (optional)
  // percentageh2000?: number;  // AS: PERCENTAGE 20H00 (optional)


  thoigianlamviec: number;    // CL: THỜI GIAN LÀM VIỆC
  tongKiemNew: number;      // CM: TỔNG KIỂM NEW
  tongDatNew: number;       // CN: TỔNG ĐẠT NEW
  tongLoiNew: number;      // CO: TỔNG LỖI NEW


  // Hourly data object for compatibility
  hourlyData: 
  // {
  //   h830: number;
  //   h930: number;
  //   h1030: number;
  //   h1130: number;
  //   h1330: number;
  //   h1430: number;
  //   h1530: number;
  //   h1630: number;
  //   h1800: number;
  //   h1900: number;
  //   h2000: number;
  //   percentageh830?: number;
  //   percentageh930?: number;
  //   percentageh1030?: number;
  //   percentageh1130?: number;
  //   percentageh1330?: number;
  //   percentageh1430?: number;
  //   percentageh1530?: number;
  //   percentageh1630?: number;
  //   percentageh1800?: number;
  //   percentageh1900?: number;
  //   percentageh2000?: number;
  // } | 
  {
    [key: string]: {
      sanluong: number;
      percentage: number;
      sanluongNew?: number;      // TEST: tongDat của giờ hiện tại
      percentageNew?: number;    // TEST: tongDat / targetGio
      tongKiemV2?: number;      // TEST: tongKiemV2 của giờ hiện tại
      rft: number;
      tongKiem: number;
      datLan1: number;
      tongDat: number;
      loi1: number; loi2: number; loi3: number; loi4: number; loi5: number;
      loi6: number; loi7: number; loi8: number; loi9: number; loi10: number;
      loi11: number; loi12: number; loi13: number; loi14: number;
      errorpercentage1: number; errorpercentage2: number; errorpercentage3: number; errorpercentage4: number;
      errorpercentage5: number; errorpercentage6: number; errorpercentage7: number; errorpercentage8: number;
      errorpercentage9: number; errorpercentage10: number; errorpercentage11: number; errorpercentage12: number;
      errorpercentage13: number; errorpercentage14: number;
      tuiChuaTaiChe: number;
      tuiChuaTaiCheNew: number;
      duLieu?: string;          // AI: DỮ LIỆU (Data/Notes from ENDLINE)
      nguyenNhan?: string;      // AJ: NGUYÊN NHÂN (Root Cause from ENDLINE)
    };
  };

  // Thông tin bổ sung (AT-AX)
  lean: string;               // AT: LEAN
  phanTram100: number;        // AU: PHAN TRAM 100
  t: number;                  // AV: T
  l: number;                  // AW: L
  image: string;              // AX: IMAGE

  // Additional fields (BE-BH)
  lktuiloi: number;           // BE: LKTUI LOI
  nhipsx: number;             // BF: NHIP SX
  tansuat: number;            // BG: TAN SUAT
  tyleloi: number;           // BH: TY LE LOI
  loikeo: number;             // BI: LOI KEO
  loison: number;             // BJ: LOI SON
  loichi: number;             // BK: LOI CHI
  phanTramLoiKeo: number; // BL: PHAN TRAM LOI KEO
  phanTramLoiSon: number; // BM: PHAN TRAM LOI SON
  phanTramLoiChi: number; // BN: PHAN TRAM LOI CHI
  QCTarget: number;        // BO: QC TARGET

  tongDat: number;          // BP: TỔNG ĐẠT
  tuiChuaTaiChe: number;   // BQ: TÚI CHỨA TÁI CHẾ
  tuiChuaTaiCheNew: number;   // BR: TÚI CHỨA TÁI CHẾ NEW

  // CD-specific fields (only for CD lines) - REMOVED from new structure
  // loiDinhKeo?: number;
  // loiBungKeo?: number;
  // loiLang?: number;
  // loiDuongMay?: number;
  // loiVatTu?: number;
  // loiMauKDB?: number;
  // loiNhan?: number;
  // loiEpNhiet?: number;
  // loiFoil?: number;
  // loiKhac?: number;
  
  // khCd?: number;
  // slthCd?: number;
  // slclCd?: number;
  // phanTramTienDo?: number;
  
  // phanTramLoiDinhKeo?: number;
  // phanTramLoiBungKeo?: number;
  // phanTramLoiLang?: number;
  // phanTramLoiDuongMay?: number;
  // phanTramLoiVatTu?: number;
  // phanTramLoiMauKDB?: number;
  // phanTramLoiNhan?: number;
  // phanTramLoiEpNhiet?: number;
  // phanTramLoiFoil?: number;
  // phanTramLoiKhac?: number;
  
  // tonBqNgay?: number;
  // ngayTon?: number;
  // tonMay?: number;
  // ngayTonMay?: number;
  
  // tglv?: number;
  // kiemNew?: number;
  // datNew?: number;
  
  // rftDetail?: {...};
  
  // CD new structure fields (AI-AV: index 34-46)
  khGiaoThang?: number;         // AM (38): KH GIAO THÁNG
  khbqGQ?: number;              // AN (39): KH BQ GQ
  slkh_bqlk?: number;           // AO (40): SL KH BQ LK
  slthThang?: number;           // AP (41): SL TH THÁNG
  phanTramThang?: number;       // AQ (41): % THÁNG (duplicate index?)
  conlai?: number;              // AR (42): CÒN LẠI
  bqCansxNgay?: number;         // AS (43): BQ CẦN SX NGÀY
  tglv?: number;                // AT (44): TGLV
  ncdv?: number;                // AU (45): NCĐV (main row value)
  dbcu?: number;                // AV (46): ĐBCỨ (main row value)
  
  // CD Sub-rows data (NEW) - Each line has multiple sub-rows (teams/products)
  subRows?: Array<{
    tglv: number;                // AT (45): TGLV (team number from sheet)
    to: string;                  // D (3): TỔ (team)
    maHang: string;              // E (4): MÃ HÀNG (product code)
    targetNgay: number;          // T (19): TARGET NGÀY (daily target)
    targetGio: number;           // U (20): TARGET GIỜ (hourly target)
    lkkh: number;                // AL (37): LKKH (cumulative plan)
    lkth: number;                // V (21): LKTH (cumulative actual)
    ncdv: number;                // AU (46): NCĐV (demand)
    dbcu: number;                // AV (47): ĐBCỨ (supply commitment)
    phanTramDapUng: number;      // AW (48): %ĐÁP ỨNG (response percentage)
    tonMay: number;              // AX (49): TỒN MAY (inventory)
    nc1ntt: number;              // AY (50): NC1NTT (next day 1)
    nc2ntt: number;              // AZ (51): NC2NTT (next day 2)
    nc3ntt: number;              // BA (52): NC3NTT (next day 3)
    note: string;                // BB (53): NOTE (notes)
    db1ntt?: number;             // BC (54): ĐB1NTT (next day supply commitment 1)
    db2ntt?: number;             // BD (55): ĐB2NTT (next day supply commitment 2)
    db3ntt?: number;             // BE (56): ĐB3NTT (next day supply commitment 3)
    dbNgay?: number;             // BF (57): DB NGÀY (Daily DB)
  }>;
  ncdvTotal?: number;           // Total NCDV (main + sum of sub-rows)
  dbcuTotal?: number;           // Total ĐBCỨ (main + sum of sub-rows)
  tonMayTotal?: number;         // Total TỒN MAY (sum of sub-rows)
  nc1nttTotal?: number;         // Total NC1NTT (sum of sub-rows)
  nc2nttTotal?: number;         // Total NC2NTT (sum of sub-rows)
  nc3nttTotal?: number;         // Total NC3NTT (sum of sub-rows)
  db1nttTotal?: number;         // Total ĐB1NTT (sum of sub-rows)
  db2nttTotal?: number;         // Total ĐB2NTT (sum of sub-rows)
  db3nttTotal?: number;         // Total ĐB3NTT (sum of sub-rows)
  dbNgayTotal?: number;         // Total DB NGÀY (sum of sub-rows)

  // Grouping metadata from backend (NEW)
  groupingRule?: number[][] | null; // e.g., [[6,8], [7,9]] = group T6+T8, T7+T9

  lktuiloiNew: number;
}

// TV Display API Response Structure
export interface TVDisplayAPIResponse {
  success: boolean;
  code: string;
  lineType?: LineType; // HTM or CD
  factory?: string; // Factory name for CD lines (returns 4 lines per factory)
  count?: number; // Number of lines returned (4 for CD)
  data: {
    maChuyen: string;
    maChuyenLine: string;
    nhaMay: string;
    line: string;
    to: string;
    maHang: string;
    canBoQuanLy?: string;   // Additional field: CÁN BỘ QUẢN LÝ
    metrics: {
      // All fields from F-AS as metrics object
      slth: number;
      congKh: number;
      congTh: number;
      pphKh: number;
      pphTh: number;
      phanTramHtPph: number;
      gioSx: number;
      ldCoMat: number;
      ldLayout: number;
      ldHienCo: number;
      nangSuat: number;
      pphTarget: number;
      pphGiao: number;
      phanTramGiao: number;
      targetNgay: number;
      targetGio: number;
      lkth: number;
      phanTramHt: number;
      // h830: number;
      // h930: number;
      // h1030: number;
      // h1130: number;
      // h1330: number;
      // h1430: number;
      // h1530: number;
      // h1630: number;
      // h1800: number;
      // h1900: number;
      // h2000: number;

      // percentageh830?: number;
      // percentageh930?: number;
      // percentageh1030?: number;
      // percentageh1130?: number;
      // percentageh1330?: number;
      // percentageh1430?: number;
      // percentageh1530?: number;
      // percentageh1630?: number;
      // percentageh1800?: number;
      // percentageh1900?: number;
      // percentageh2000?: number;

      lean: string;
      phanTram100: number;
      t: number;
      l: number;
      image: string;
      lkkh: number;
      bqTargetGio: number;
      slcl: number;
      rft: number;
      tongKiem: number;
      mucTieuRft: number;

      // Additional fields (BE-BH)
      lktuiloi: number;
      nhipsx: number;
      tansuat: number;
      tyleloi: number;
      loikeo: number;
      loison: number;
      loichi: number;
      phanTramLoiKeo: number;
      phanTramLoiSon: number;
      phanTramLoiChi: number;
      QCTarget: number;

      tongDat: number;
      tuiChuaTaiChe: number;
      tuiChuaTaiCheNew: number;

      thoigianlamviec: number;
      tongKiemNew: number;
      tongDatNew: number;
      tongLoiNew: number;

      lktuiloiNew: number;
      percentagePPHNew: number;
      percentageSLTHNew: number;
      diffPercentagePPHNew: number;
      diffPercentageSLTHNew: number;

    };
    hourlyData: {
      hourly: { [key: string]: number };
      cumulative: { [key: string]: number };
      total: number;
      latest: { hour: string; value: number };
    };
    lastUpdate: string;
    cacheTime: number;
  };
  timestamp: string;
  cached: boolean;
}

// Production API Response Structure
export interface ProductionAPIResponse {
  success: boolean;
  data: {
    maChuyenLine: string;
    factory: string;
    data: BackendProductionRecord[];
    summary: BackendProductionRecord;
    totalRecords: number;
    lastUpdate: string;
  };
  timestamp: string;
}

// WebSocket Update Structure
export interface WebSocketUpdate {
  maChuyenLine?: string;
  factory?: string;
  data: {
    type: 'updated' | 'new' | 'deleted';
    data: BackendProductionRecord;
    summary: BackendProductionRecord;
  };
  timestamp: string;
  _testUpdate?: boolean; // Flag for test data (should be rejected)
}

// API Query Parameters
export interface ProductionQuery {
  maChuyenLine?: string;
  factory?: string;
  line?: string;
  team?: string;
  shift?: number;
}

// Error Response Structure
export interface APIErrorResponse {
  success: false;
  error: string;
  message?: string;
  code?: string;
  timestamp: string;
}

// Production Lines List Response
export interface ProductionLinesResponse {
  success: boolean;
  lines: Array<{
    code: string;
    nhaMay: string;
    line: string;
    to: string;
    percentagePPH: string;
    percentageHT: string;
    rft: string;
    lineType: 'HTM' | 'CD';
    // QSL data (only for HTM lines)
    qslGroups?: Array<{
      id: number;
      nhaMay: string;
      line: string;
      nhom: string; // Quai/Sơn/Lót
      layout: number;
      tglv: number;
      keHoachGio: number;
      keHoachNgay: number;
      lkKh: number;
      lkTh: number;
      phanTramHt: number;
      [key: string]: any;
    }>;
    qslSummary?: {
      totalGroups: number;
      groups: Array<{
        name: string;
        code: string;
        layout: number;
        coMat: number;
        keHoachGio: number;
        keHoachNgay: number;
        lkKh: number;
        lkTh: number;
        phanTramHt: number;
      }>;
    };
  }>;
  count: {
    total: number;
    htm: number;
    cd: number;
  };
  includeQSL: boolean;
  timestamp: string;
}

// HTM Center TV Types - DATA sheet with 3 groups per line
export interface CenterTVGroup {
  id: number;
  nhaMay: string;           // A: NM
  line: string;             // B: LINE
  nhom: string;             // C: NHÓM (Quai/Sơn/Lót)
  layout: number;           // D: LAYOUT
  tglv: number;             // E: TGLV
  keHoachGio: number;       // F: KẾ HOẠCH GIỜ
  keHoachNgay: number;      // G: KẾ HOẠCH NGÀY
  
  // Hourly data (H-R)
  h830: number;
  h930: number;
  h1030: number;
  h1130: number;
  h1330: number;
  h1430: number;
  h1530: number;
  h1630: number;
  h1800: number;
  h1900: number;
  h2000: number;
  
  soLuongGiaoMay: number;   // S: SỐ LƯỢNG GIAO MAY
  lkKh: number;             // T: LUỸ KẾ KẾ HOẠCH
  lkTh: number;             // U: LUỸ KẾ THỰC HIỆN
  phanTramHt: number;       // V: %HT
  lean: string;             // W: LEAN
  bqTargetGio: number;      // X: BQ TARGET GIỜ
  sthd: number;             // Y: STHĐ
  slcl: number;             // Z: SLCL
  tienDoApUng: number;      // AA: TIẾN ĐỘ ĐÁP ỨNG
  
  // Calculated fields
  diffLkThKh: number;       // lkTh - lkKh
  diffPhanTramHt100: number; // %HT - 100%
}

export interface CenterTVResponse {
  success: boolean;
  factory: string;
  line: string;
  data: {
    groups: CenterTVGroup[];
    summary: {
      totalGroups: number;
      totalLayout: number;
      totalKeHoachNgay: number;
      totalLkTh: number;
      totalLkKh: number;
      averagePhanTramHt: number;
      tglv?: number;
    };
  };
  timestamp: string;
}

// Generic API Response
export type APIResponse<T> = T | APIErrorResponse;

export default BackendProductionRecord;